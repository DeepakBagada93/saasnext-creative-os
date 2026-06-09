import os
import re
import random
import json
from typing import List
import httpx
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv
load_dotenv()

# Initialize GenAI Client
api_key = os.environ.get("GEMINI_API_KEY")
client = None
if api_key:
    client = genai.Client(api_key=api_key)
    print("[GeminiService] Initialized with API key.")
else:
    print("[GeminiService] No GEMINI_API_KEY found. Running in mockup mode.")

# --- Pydantic Schema Definitions for Structured Output ---

class MarketResearchSchema(BaseModel):
    pain_points: List[str] = Field(description="List of core customer pain points")
    desires: List[str] = Field(description="List of customer desires and aspirations")
    fears: List[str] = Field(description="List of customer fears and anxieties")
    objections: List[str] = Field(description="List of purchase objections and friction points")
    buying_triggers: List[str] = Field(description="List of events or emotions that trigger a purchase")

class CompetitorAnalysisSchema(BaseModel):
    positioning: str = Field(description="Strategic market positioning summary")
    offers: List[str] = Field(description="Competitor offers and pricing structures")
    messaging: List[str] = Field(description="Core messaging themes and copy angles")
    strengths: List[str] = Field(description="Key competitor strengths")
    weaknesses: List[str] = Field(description="Competitor weaknesses and gaps to exploit")

class GenerateHooksSchema(BaseModel):
    curiosity: List[str] = Field(description="Exactly 20 curiosity-based hooks")
    pain: List[str] = Field(description="Exactly 20 pain-point-based hooks")
    authority: List[str] = Field(description="Exactly 20 authority/credibility hooks")
    contrarian: List[str] = Field(description="Exactly 20 contrarian/counter-intuitive hooks")
    urgency: List[str] = Field(description="Exactly 20 urgency/scarcity hooks")

class AngleItem(BaseModel):
    name: str = Field(description="Name of the marketing angle (e.g. 'The Sleep-Deprived Parent')")
    angle: str = Field(description="Brief description of the angle and copy focus")

class GenerateAnglesSchema(BaseModel):
    angles: List[AngleItem] = Field(description="Exactly 50 unique marketing angles")

class ConceptItem(BaseModel):
    hook: str = Field(description="The attention-grabbing hook")
    angle: str = Field(description="The strategic angle")
    creative_brief: str = Field(description="Visual and execution brief for creators/designers")
    cta: str = Field(description="The call to action")

class GenerateCreativeConceptsSchema(BaseModel):
    concepts: List[ConceptItem] = Field(description="Exactly 20 creative ad concepts")

class ScriptItem(BaseModel):
    title: str = Field(description="Title of the UGC script")
    visual_hook: str = Field(description="Visual hook to stop the scroll")
    script_body: str = Field(description="The full spoken dialogue with [VISUAL ACTIONS] and [TEXT ON SCREEN] bracketed")
    cta: str = Field(description="Call to Action at the end")

class GenerateUgcScriptsSchema(BaseModel):
    scripts: List[ScriptItem] = Field(description="Exactly 10 UGC video scripts")


class GeminiService:
    @staticmethod
    async def get_embedding(text: str) -> List[float]:
        """
        Generates embedding for text content.
        """
        if not client:
            # Return a mock vector of 768 dimensions filled with random numbers
            return [random.uniform(-1.0, 1.0) for _ in range(768)]

        try:
            response = client.models.embed_content(
                model="text-embedding-004",
                contents=text,
            )
            if response.embeddings and len(response.embeddings) > 0 and response.embeddings[0].values:
                return [float(x) for x in response.embeddings[0].values]
            elif hasattr(response, 'embedding') and getattr(response, 'embedding').values:
                return [float(x) for x in getattr(response, 'embedding').values]
            raise ValueError("Invalid embedding response format")
        except Exception as e:
            print(f"[GeminiService] Error generating embedding: {e}")
            return [random.uniform(-1.0, 1.0) for _ in range(768)]

    @staticmethod
    async def market_research(product: str, audience: str, industry: str) -> dict:
        """
        1. Market Research Tool
        """
        if not client:
            return GeminiService._get_mock_market_research(product, audience, industry)

        prompt = f"""Conduct in-depth market research for a product/service in the '{industry}' industry.
Product: {product}
Target Audience: {audience}

Provide a structured analysis focusing on:
1. Pain points (the target audience's core problems, struggles, or frustrations)
2. Desires (what they deeply want, aspirationally or functionally)
3. Fears (what they want to avoid, their anxieties, or worst-case scenarios)
4. Objections (why they would say 'no' to buying this product)
5. Buying triggers (what events, emotions, or logic will compel them to take action now)"""

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=MarketResearchSchema,
                )
            )
            return json.loads(response.text or "{}")
        except Exception as e:
            print(f"[GeminiService] Error in market_research: {e}")
            return GeminiService._get_mock_market_research(product, audience, industry)

    @staticmethod
    async def competitor_analysis(urls: List[str]) -> dict:
        """
        2. Competitor Analysis Tool
        """
        if not client:
            return GeminiService._get_mock_competitor_analysis(urls)

        fetched_context = ""
        async with httpx.AsyncClient() as http_client:
            for url in urls:
                try:
                    print(f"[GeminiService] Attempting to fetch content from {url}")
                    res = await http_client.get(url, timeout=5.0, follow_redirects=True)
                    if res.status_code == 200:
                        text = res.text
                        # Strip HTML tags
                        clean_text = re.sub(r'<[^>]*>', ' ', text)
                        clean_text = re.sub(r'\s+', ' ', clean_text).strip()[:2000]
                        fetched_context += f"Website Source: {url}\nContent Snippet: {clean_text}\n\n"
                except Exception as err:
                    print(f"[GeminiService] Could not fetch {url} directly: {err}")

        prompt = f"""Analyze the competitor websites listed below.
Competitor URLs: {', '.join(urls)}
{f"Website Data Gathered:\n{fetched_context}\n" if fetched_context else ""}
Provide a comprehensive marketing analysis of these competitors:
1. Positioning (How they present themselves, their unique angle or category)
2. Offers (What products/services are they selling, prices, guarantees, bonuses)
3. Messaging (Key themes, slogans, tone of voice, main benefits highlighted)
4. Strengths (What they are doing exceptionally well)
5. Weaknesses (Where they are falling short, gaps, poor user experience)"""

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=CompetitorAnalysisSchema,
                )
            )
            return json.loads(response.text or "{}")
        except Exception as e:
            print(f"[GeminiService] Error in competitor_analysis: {e}")
            return GeminiService._get_mock_competitor_analysis(urls)

    @staticmethod
    async def generate_hooks(product: str, audience: str, goal: str) -> dict:
        """
        3. Generate Hooks Tool (100 Hooks: 20 per category)
        """
        if not client:
            return GeminiService._get_mock_hooks(product, audience, goal)

        prompt = f"""Generate exactly 100 high-converting marketing hooks (headline or first line of an ad) for this product/service.
Product: {product}
Target Audience: {audience}
Goal: {goal}

Generate exactly 20 hooks for each of the following 5 categories:
1. curiosity (hooks that provoke questions, make readers want to know more, open loops)
2. pain (hooks that immediately highlight a problem or pain point they experience)
3. authority (hooks leveraging statistics, case studies, expertise, credentials, or expert proof)
4. contrarian (hooks that challenge conventional wisdom, state something shocking, or go against the grain)
5. urgency (hooks creating FOMO, time limits, or highlighting the cost of delaying action)

You must return exactly 20 hooks per category, totaling 100 hooks."""

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GenerateHooksSchema,
                )
            )
            return json.loads(response.text or "{}")
        except Exception as e:
            print(f"[GeminiService] Error in generate_hooks: {e}")
            return GeminiService._get_mock_hooks(product, audience, goal)

    @staticmethod
    async def generate_angles(product: str, audience: str) -> dict:
        """
        4. Generate Angles Tool (50 Angles)
        """
        if not client:
            return GeminiService._get_mock_angles(product, audience)

        prompt = f"""Generate exactly 50 distinct, high-converting marketing angles (perspectives, unique selling propositions, copy themes, or framing strategies) to sell this product to the target audience.
Product: {product}
Target Audience: {audience}

Make sure each angle has a clear, catchy name and a brief description of how it frames the product.
Total: 50 angles."""

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GenerateAnglesSchema,
                )
            )
            return json.loads(response.text or "{}")
        except Exception as e:
            print(f"[GeminiService] Error in generate_angles: {e}")
            return GeminiService._get_mock_angles(product, audience)

    @staticmethod
    async def generate_creative_concepts(product: str, audience: str, competitors: List[str]) -> dict:
        """
        5. Generate Creative Concepts Tool (20 Concepts)
        """
        if not client:
            return GeminiService._get_mock_creative_concepts(product, audience, competitors)

        prompt = f"""Generate exactly 20 distinct ad creative concepts for marketing this product.
Product: {product}
Target Audience: {audience}
{f"Competitors to counter-position against: {', '.join(competitors)}" if competitors else ""}

For each creative concept, provide:
1. Hook (the visual/audio hook to capture attention in the first 3 seconds)
2. Angle (the core psychological angle or theme being used)
3. Creative Brief (description of the visual sequence, video actions, copy overlay, or graphic representation)
4. CTA (Call To Action - what the user should do next)

Total: 20 concepts."""

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GenerateCreativeConceptsSchema,
                )
            )
            return json.loads(response.text or "{}")
        except Exception as e:
            print(f"[GeminiService] Error in generate_creative_concepts: {e}")
            return GeminiService._get_mock_creative_concepts(product, audience, competitors)

    @staticmethod
    async def generate_ugc_scripts(product: str, audience: str) -> dict:
        """
        6. Generate UGC Scripts Tool (10 Scripts)
        """
        if not client:
            return GeminiService._get_mock_ugc_scripts(product, audience)

        prompt = f"""Generate exactly 10 short, high-converting User Generated Content (UGC) video scripts (ideal for TikTok, Reels, or Shorts, 30-60 seconds long).
Product: {product}
Target Audience: {audience}

For each of the 10 scripts, provide:
1. Title/Name
2. Visual Hook (first 3 seconds visual action)
3. Script body (with speaker lines and visual cues/text overlay directions)
4. CTA (Call to action)"""

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GenerateUgcScriptsSchema,
                )
            )
            return json.loads(response.text or "{}")
        except Exception as e:
            print(f"[GeminiService] Error in generate_ugc_scripts: {e}")
            return GeminiService._get_mock_ugc_scripts(product, audience)

    # --- MOCK FALLBACK DATA GENERATION ---

    @staticmethod
    def _get_mock_market_research(product: str, audience: str, industry: str) -> dict:
        return {
            "pain_points": [
                f"High cost and low efficiency in current {industry} solutions.",
                f"Friction and complex onboarding for target audience: {audience}.",
                f"Lack of transparency and difficulty tracking results for {product}."
            ],
            "desires": [
                "Achieve seamless workflow automation and measurable growth.",
                "Saves time and reduces stress, allowing focus on core creative tasks.",
                "Affordable scaling without hiring expensive full-time agencies."
            ],
            "fears": [
                "Wasting marketing budget on ineffective campaigns.",
                "Falling behind competitors who adopt AI and advanced analytics.",
                "Technical lock-in or complex systems that require intensive training."
            ],
            "objections": [
                f"Is {product} really as easy to use as advertised?",
                f"How is this different from competitor solutions in {industry}?",
                "Is there a contracts commitment or can I cancel anytime?"
            ],
            "buying_triggers": [
                "Preparing for a major product launch or seasonal marketing campaign.",
                "A recent drop in organic conversion rate or rise in customer acquisition cost.",
                "Getting a recommendation from an industry expert or reading a case study."
            ]
        }

    @staticmethod
    def _get_mock_competitor_analysis(urls: List[str]) -> dict:
        return {
            "positioning": "Premium, enterprise-grade tools focused on standard automation and integration, targeting corporate buyers.",
            "offers": [
                "Monthly subscriptions starting at $299/mo.",
                "14-day free trial requiring credit card details.",
                "Custom enterprise packages with dedicated support agents."
            ],
            "messaging": [
                "'Scale your team without scaling your workload.'",
                "Focusing heavily on security, ISO-compliance, and data integrity.",
                "Aspirational growth messaging but lacking quick-launch templates."
            ],
            "strengths": [
                "Strong established brand trust and deep integrations ecosystem.",
                "Comprehensive dashboard reporting and custom analytics builder."
            ],
            "weaknesses": [
                "Slow UI interface and extremely high cost for small-to-mid agencies.",
                "Steep learning curve and poor mobile responsive design.",
                "No automated generative copywriting templates."
            ]
        }

    @staticmethod
    def _get_mock_hooks(product: str, audience: str, goal: str) -> dict:
        categories = ["curiosity", "pain", "authority", "contrarian", "urgency"]
        result = {}
        for cat in categories:
            result[cat] = [
                f"Mock Hook [{cat.upper()} #{idx + 1}] designed for {audience} interested in {product} to achieve {goal}."
                for idx in range(20)
            ]
        return result

    @staticmethod
    def _get_mock_angles(product: str, audience: str) -> dict:
        return {
            "angles": [
                {
                    "name": f"Mock Angle #{idx + 1}",
                    "angle": f"Unique framing strategy focusing on benefit #{idx + 1} for {audience} using {product}."
                }
                for idx in range(50)
            ]
        }

    @staticmethod
    def _get_mock_creative_concepts(product: str, audience: str, competitors: List[str]) -> dict:
        return {
            "concepts": [
                {
                    "hook": f"Stop doing things the hard way - see how this works! (Concept #{idx + 1})",
                    "angle": f"Framing the product as the ultimate time saver for {audience}.",
                    "creative_brief": f"Open with split-screen showing a stressed person typing on the left, and a relaxed person drinking coffee on the right. Overlay text: 'Before vs After using {product}'.",
                    "cta": "Click 'Sign Up' to start saving hours today!"
                }
                for idx in range(20)
            ]
        }

    @staticmethod
    def _get_mock_ugc_scripts(product: str, audience: str) -> dict:
        return {
            "scripts": [
                {
                    "title": f"Mock UGC Script #{idx + 1}",
                    "visual_hook": "Creator looking directly at the camera, holding up their phone, gasping slightly.",
                    "script_body": f'[CREATOR]: "I literally never make videos like this, but if you\'re a {audience}, you need to hear this. I started using {product} last week, and my mind is blown. Look at [POINTS TO SCREEN OVERLAY OF RESULTS]. It\'s so fast. Seriously, just try it."',
                    "cta": "Swipe up to try it for free!"
                }
                for idx in range(10)
            ]
        }
