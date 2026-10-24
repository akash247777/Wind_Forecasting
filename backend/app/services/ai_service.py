import logging
import json
from typing import Dict, Any, Optional

from backend.app.config import settings
from backend.app.models import AiBriefingResponse

logger = logging.getLogger(__name__)

class AiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Gemini Client initialized successfully.")
            except Exception as e:
                logger.warning(f"Could not initialize google-genai Client: {e}")

    def generate_briefing(
        self,
        date: str,
        metrics: Optional[Dict[str, Any]] = None,
        user_prompt: Optional[str] = None
    ) -> AiBriefingResponse:
        """
        Generate an executive energy trading briefing analyzing wind forecast reliability
        and day-ahead procurement recommendations using Gemini AI, with algorithmic fallback.
        """
        if self.client and self.api_key:
            try:
                metrics_summary = json.dumps(metrics or {}, indent=2)
                system_prompt = (
                    "You are the Chief Quantitative Power Trader and Renewable Risk Analyst for a major UK energy utility. "
                    "You are advising the Day-Ahead power trading desk on procuring electricity from the wholesale market (EPEX SPOT / Nord Pool). "
                    "Analyze the provided wind generation forecast error data from Elexon BMRS for January 2026. "
                    "Provide a professional, actionable briefing with:\n"
                    "1. Executive Summary (2-3 sentences on wind forecast vs actual conditions and volatility)\n"
                    "2. Day-Ahead Procurement Advice (explicit recommendations on thermal procurement and downside reserve buffer)\n"
                    "3. Risk Factors (3-4 bullet points highlighting ramp errors, peak settlement period exposure, imbalance cash-out risks)\n"
                    "4. Forecast Reliability Assessment ('HIGH', 'MODERATE', or 'ELEVATED RISK')\n\n"
                    "Format your response as a valid JSON object with keys: 'executiveSummary', 'procurementAdvice', 'riskFactors' (list of strings), 'forecastReliability'."
                )
                
                content_prompt = f"Date: {date}\nMetrics: {metrics_summary}\n"
                if user_prompt:
                    content_prompt += f"\nTrader Specific Query: {user_prompt}\n"

                response = self.client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[system_prompt, content_prompt]
                )
                
                text = response.text.strip()
                # Parse JSON if possible
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()

                try:
                    data = json.loads(text)
                    return AiBriefingResponse(
                        executiveSummary=data.get("executiveSummary", "Wind forecast evaluation completed."),
                        procurementAdvice=data.get("procurementAdvice", "Maintain standard thermal buffer."),
                        riskFactors=data.get("riskFactors", ["Forecast uncertainty in ramp hours."]),
                        forecastReliability=data.get("forecastReliability", "MODERATE"),
                        source="gemini"
                    )
                except Exception:
                    # If JSON parsing failed but text returned
                    return AiBriefingResponse(
                        executiveSummary=text[:400],
                        procurementAdvice="Adjust day-ahead thermal purchase according to prevailing P90 buffer margin.",
                        riskFactors=[
                            "Potential downside wind deficit during evening demand peaks.",
                            "System Buy Price exposure in the balancing mechanism if wind drops."
                        ],
                        forecastReliability="MODERATE",
                        source="gemini"
                    )

            except Exception as e:
                logger.warning(f"Gemini API call failed, falling back to algorithmic briefing: {e}")

        # Algorithmic fallback
        return self._generate_algorithmic_briefing(date, metrics, user_prompt)

    def _generate_algorithmic_briefing(
        self,
        date: str,
        metrics: Optional[Dict[str, Any]] = None,
        user_prompt: Optional[str] = None
    ) -> AiBriefingResponse:
        metrics = metrics or {}
        mae = metrics.get("mae", 1200.0)
        mean_bias = metrics.get("meanBias", 250.0)
        wape = metrics.get("wape", 14.5)
        p90 = metrics.get("p90Error", 2100.0)

        # Risk rating
        if wape > 25.0 or mae > 2000.0:
            reliability = "ELEVATED RISK"
            summary = (
                f"For delivery on {date}, National Grid ESO wind forecasts showed elevated volatility with a WAPE of {wape}% "
                f"and an MAE of {mae:,.0f} MW. Substantial discrepancies between D-1 forecast and actual delivery were observed."
            )
            advice = (
                f"Strongly advise applying an aggressive thermal reserve margin (+{p90:,.0f} MW, P90 confidence) during peak hours. "
                "Avoid relying on unhedged wind output into gate closure to prevent punitive cash-out charges under high System Buy Price."
            )
            risks = [
                f"Downside wind deficit risk of up to {p90:,.0f} MW during steep evening ramp (17:00-19:30 GMT).",
                "High exposure to Balancing Mechanism cash-out penalties if generation drops below contracted volumes.",
                "Intraday market illiquidity requires pre-hedging the bulk of thermal requirements in the Day-Ahead auction."
            ]
        elif wape > 12.0:
            reliability = "MODERATE"
            bias_dir = "over-forecasted (wind came in lower)" if mean_bias > 0 else "under-forecasted (wind came in higher)"
            summary = (
                f"On {date}, wind generation forecasts performed within standard winter tolerance bands (WAPE: {wape}%, MAE: {mae:,.0f} MW). "
                f"Overall, models slightly {bias_dir} by an average of {abs(mean_bias):,.0f} MW."
            )
            advice = (
                f"Procure baseline thermal demand on EPEX/Nord Pool Day-Ahead auction with a moderate buffer of {mae * 0.75:,.0f} MW. "
                "Monitor intraday 4-hour ahead WINDFOR updates to fine-tune final balancing positions."
            )
            risks = [
                "Settlement period ramp divergence during morning industrial pick-up (07:00-09:00).",
                "Moderate imbalance spread between System Buy Price and System Sell Price.",
                "Thermal plant min-load constraints must be factored into partial-hour commitments."
            ]
        else:
            reliability = "HIGH"
            summary = (
                f"Forecast reliability on {date} was exceptionally strong (WAPE: {wape}%, MAE: {mae:,.0f} MW). "
                "Atmospheric pressure systems were stable across key North Sea and Scottish offshore wind clusters."
            )
            advice = (
                "Execute standard baseline thermal procurement without excessive risk premia. "
                f"A lean reserve margin of {mae * 0.5:,.0f} MW is sufficient, maximizing cost efficiency for retail consumer tariffs."
            )
            risks = [
                "Minor localized curtailment risks in Scottish transmission bottlenecks.",
                "Ensure flexible thermal units (CCGT / peakers) remain on standby for unexpected trip events."
            ]

        if user_prompt:
            summary += f" [Note: Addressing query '{user_prompt}': Analysis aligns with the statistical error boundaries observed for January 2026.]"

        return AiBriefingResponse(
            executiveSummary=summary,
            procurementAdvice=advice,
            riskFactors=risks,
            forecastReliability=reliability,
            source="algorithmic"
        )

ai_service = AiService()
