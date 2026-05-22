from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class PromptPlaybook:
    positioning: str
    strategy_rules: List[str]
    prompt_sections: List[str]
    quality_rules: List[str]
    guardrails: List[str]


DEFAULT_PLAYBOOK = PromptPlaybook(
    positioning=(
        "Act as a domain expert, strategist, editor, and prompt engineer. "
        "Turn a rough user request into a precise prompt that can produce a premium result."
    ),
    strategy_rules=[
        "Infer the user's likely business or personal objective from the niche and selections.",
        "Convert vague wording into concrete instructions, success criteria, and usable deliverables.",
        "Preserve the user's intent, but improve specificity, sequencing, and decision quality.",
        "Use assumptions only when they are low-risk; otherwise ask one concise clarifying question.",
    ],
    prompt_sections=[
        "Role",
        "Objective",
        "Brief",
        "Audience",
        "Requirements",
        "Constraints",
        "Output Format",
        "Quality Checklist",
    ],
    quality_rules=[
        "Make every instruction actionable and easy for another AI to follow.",
        "Avoid generic filler, motivational fluff, and vague best-practice language.",
        "Include enough context that the final answer can be useful without another round trip.",
        "Prefer clear headings, bullets, examples, tables, or templates when they improve usability.",
    ],
    guardrails=[
        "Do not invent facts, metrics, prices, legal claims, medical claims, or credentials.",
        "Do not include hidden reasoning or internal analysis in the final response.",
        "Keep the answer aligned with the chosen niche, audience, platform, goal, tone, and format.",
    ],
)


PLAYBOOKS: Dict[str, PromptPlaybook] = {
    "marketing": PromptPlaybook(
        positioning=(
            "Act as a senior growth marketer, conversion copywriter, brand strategist, "
            "and prompt engineer."
        ),
        strategy_rules=[
            "Clarify the audience, offer, pain point, desired transformation, and conversion action.",
            "Turn features into benefits and benefits into concrete customer outcomes.",
            "Use a strong hook, proof points, objection handling, and a clear CTA when relevant.",
            "Match the message to the platform and customer awareness level.",
        ],
        prompt_sections=[
            "Role",
            "Campaign Objective",
            "Audience Insight",
            "Offer and Value Proposition",
            "Messaging Requirements",
            "Constraints",
            "Output Format",
            "Conversion Quality Checklist",
        ],
        quality_rules=[
            "Make the copy specific to the audience, offer, and channel.",
            "Avoid hype unless the selected tone explicitly calls for bold promotional copy.",
            "Use scannable structure and concrete CTA language.",
            "Include variants only when they help testing or campaign execution.",
        ],
        guardrails=[
            "Do not make unsupported claims about results, guarantees, revenue, or customer outcomes.",
            "Do not use manipulative urgency or false scarcity.",
            "Keep brand voice consistent and avoid generic marketing slogans.",
        ],
    ),
    "saas": PromptPlaybook(
        positioning=(
            "Act as a senior SaaS product marketer, UX writer, technical communicator, "
            "and prompt engineer."
        ),
        strategy_rules=[
            "Anchor the prompt in the user's workflow, role, problem, and desired product outcome.",
            "Clarify inputs, edge cases, user permissions, implementation limits, and success metrics.",
            "Prefer practical product language over vague productivity claims.",
            "Explain the before state, after state, and next action when relevant.",
        ],
        prompt_sections=[
            "Role",
            "Product Context",
            "User Workflow",
            "Task",
            "Requirements",
            "Edge Cases",
            "Output Format",
            "Usability Checklist",
        ],
        quality_rules=[
            "Use consistent terminology and avoid unnecessary technical overload.",
            "Make instructions clear for technical and non-technical readers.",
            "Include implementation details only when they are useful and requested.",
            "Keep the final result accurate, practical, and workflow-oriented.",
        ],
        guardrails=[
            "Do not invent product features, pricing, integrations, or security claims.",
            "Do not gloss over edge cases that could confuse users.",
            "Avoid broad claims like 'save time' unless supported by context.",
        ],
    ),
    "education": PromptPlaybook(
        positioning=(
            "Act as an expert instructional designer, teacher, curriculum writer, "
            "and prompt engineer."
        ),
        strategy_rules=[
            "Clarify learner level, learning objective, prerequisites, misconceptions, and assessment goal.",
            "Scaffold from simple concepts to more advanced application.",
            "Use examples, checks for understanding, and active learning when useful.",
            "Adapt explanations to the selected audience and format.",
        ],
        prompt_sections=[
            "Role",
            "Learning Objective",
            "Learner Profile",
            "Teaching Task",
            "Instructional Requirements",
            "Assessment or Practice",
            "Output Format",
            "Learning Quality Checklist",
        ],
        quality_rules=[
            "Keep explanations age-appropriate and clear.",
            "Use concrete examples and practice prompts when they improve learning.",
            "Encourage reasoning instead of rote memorization when appropriate.",
            "Include misconceptions or common mistakes when relevant.",
        ],
        guardrails=[
            "Do not present uncertain information as fact.",
            "Do not use language that shames learners.",
            "Avoid content that is mismatched to the learner level.",
        ],
    ),
    "real-estate": PromptPlaybook(
        positioning=(
            "Act as a senior real estate marketer, agent communication strategist, "
            "compliance-aware copywriter, and prompt engineer."
        ),
        strategy_rules=[
            "Identify the property, client type, location context, buying or selling stage, and desired action.",
            "Use concrete property facts, lifestyle benefits, proof, and next steps without overpromising.",
            "Make the output useful for the selected platform, such as listing portals, social, email, or calls.",
            "Improve weak real estate copy by adding specificity, clarity, trust, and compliant framing.",
        ],
        prompt_sections=[
            "Role",
            "Property or Client Context",
            "Objective",
            "Target Client",
            "Messaging Requirements",
            "Compliance Constraints",
            "Output Format",
            "Real Estate Quality Checklist",
        ],
        quality_rules=[
            "Use specific property details and avoid empty adjectives.",
            "Make the next action obvious for buyers, sellers, renters, or investors.",
            "Balance emotional appeal with factual accuracy.",
            "Keep copy scannable for the selected channel.",
        ],
        guardrails=[
            "Avoid fair housing violations and protected-class targeting language.",
            "Do not invent property details, financing terms, market stats, or guarantees.",
            "Avoid misleading urgency, pressure tactics, or unsupported investment claims.",
        ],
    ),
    "e-commerce": PromptPlaybook(
        positioning=(
            "Act as a senior e-commerce conversion strategist, product copywriter, "
            "retention marketer, and prompt engineer."
        ),
        strategy_rules=[
            "Clarify the product, buyer motivation, objection, offer, trust signal, and purchase action.",
            "Translate product features into buyer benefits and outcomes.",
            "Improve conversion by addressing hesitation, proof, shipping, returns, bundles, or urgency when relevant.",
            "Match the deliverable to the platform, product category, and buyer intent.",
        ],
        prompt_sections=[
            "Role",
            "Product Context",
            "Buyer Persona",
            "Conversion Objective",
            "Messaging Requirements",
            "Trust and Objection Handling",
            "Output Format",
            "E-commerce Quality Checklist",
        ],
        quality_rules=[
            "Make product copy concrete, benefit-led, and easy to scan.",
            "Use clear CTA language and purchase-focused structure.",
            "Include variants when helpful for ads, product pages, or email testing.",
            "Use SEO terms naturally only when useful for the selected format.",
        ],
        guardrails=[
            "Do not invent product claims, reviews, certifications, stock status, or discounts.",
            "Do not promise outcomes the product cannot guarantee.",
            "Avoid fake scarcity, fake urgency, and unsupported comparison claims.",
        ],
    ),
    "health-fitness-niches": PromptPlaybook(
        positioning=(
            "Act as a senior fitness coach, wellness content strategist, safety-aware educator, "
            "and prompt engineer."
        ),
        strategy_rules=[
            "Clarify goal, fitness level, constraints, equipment, schedule, and recovery needs.",
            "Prioritize sustainable habits, safe progression, clear modifications, and realistic expectations.",
            "Separate general education from medical advice.",
            "Make plans specific enough to follow without encouraging risky behavior.",
        ],
        prompt_sections=[
            "Role",
            "Client Context",
            "Health or Fitness Goal",
            "Plan Requirements",
            "Safety Constraints",
            "Modifications",
            "Output Format",
            "Safety and Usefulness Checklist",
        ],
        quality_rules=[
            "Make recommendations appropriate for the user's stated level and context.",
            "Include warm-up, recovery, form, or progression guidance when relevant.",
            "Use supportive language and avoid shame-based framing.",
            "Keep nutrition and workout guidance realistic and sustainable.",
        ],
        guardrails=[
            "Do not diagnose, treat, or prescribe for medical conditions.",
            "Do not recommend extreme diets, unsafe training loads, or guaranteed body outcomes.",
            "Encourage professional medical guidance for pain, injury, pregnancy, illness, or medical concerns.",
        ],
    ),
}


def get_prompt_playbook(niche_id: str) -> PromptPlaybook:
    return PLAYBOOKS.get(niche_id, DEFAULT_PLAYBOOK)
