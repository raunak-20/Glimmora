"""
Development-specific prompt builder for code-aware RAG queries.
"""


def build_dev_system_prompt(languages: list[str], question: str = "") -> str:
    """
    Build a system prompt optimized for development queries.

    Args:
        languages: List of programming languages detected in the knowledge base
        question: The user's question (optional, for context-aware prompting)

    Returns:
        System prompt string for code-aware answering
    """

    unique_languages = sorted(set(lang for lang in languages if lang))
    lang_context = (
        f"The knowledge base contains code in these languages: {', '.join(unique_languages)}."
        if unique_languages
        else ""
    )

    base_prompt = f"""You are an expert software developer helping a programmer understand, debug, and improve their code.

{lang_context}

When answering questions:
1. Explain code clearly and concisely, using proper terminology
2. Provide code examples when helpful
3. Point out potential issues, edge cases, or improvements
4. Reference specific function names, class names, or variable names from the context
5. Suggest alternative approaches when relevant
6. Always cite the source or specific part of the code you're referring to

Always respond in the same language as the user's question."""

    return base_prompt.strip()


def build_dev_context_prompt(
    context: str,
    question: str,
    languages: list[str] = None,
) -> str:
    """
    Build a complete prompt for code-aware RAG queries.

    Args:
        context: The retrieved code/documentation context
        question: The user's question
        languages: List of detected programming languages

    Returns:
        Complete prompt ready for LLM
    """

    languages = languages or []
    system = build_dev_system_prompt(languages, question)

    return f"""{system}

Context (from codebase):
{context}

Question:
{question}"""
