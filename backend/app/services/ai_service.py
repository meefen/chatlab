import json
from openai import OpenAI
from anthropic import Anthropic
from typing import Dict, Any
from ..config import settings

# Initialize clients
openai_client = None
anthropic_client = None

if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY not in ["sk-fake-key-for-development", "your_openai_key"]:
    openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

if settings.ANTHROPIC_API_KEY and settings.ANTHROPIC_API_KEY not in ["sk-ant-fake-key-for-development", "your_anthropic_key"]:
    print(f"Initializing Anthropic client with key starting with: {settings.ANTHROPIC_API_KEY[:10]}...")
    anthropic_client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
else:
    print(f"Anthropic key not valid: {settings.ANTHROPIC_API_KEY[:20] if settings.ANTHROPIC_API_KEY else 'None'}...")

class CharacterResponse:
    def __init__(self, content: str, should_continue: bool):
        self.content = content
        self.should_continue = should_continue

async def generate_character_response(
    character_name: str,
    character_personality: str,
    conversation_history: str,
    user_prompt: str = None
) -> CharacterResponse:
    try:
        if settings.AI_PROVIDER == "anthropic" and anthropic_client:
            return await _generate_with_anthropic(character_name, character_personality, conversation_history, user_prompt)
        elif settings.AI_PROVIDER == "openai" and openai_client:
            return await _generate_with_openai(character_name, character_personality, conversation_history, user_prompt)
        else:
            raise Exception(f"AI provider '{settings.AI_PROVIDER}' not configured or API key missing")
    except Exception as error:
        raise Exception(f"Failed to generate response for {character_name}: {str(error)}")

async def _generate_with_anthropic(
    character_name: str,
    character_personality: str,
    conversation_history: str,
    user_prompt: str = None
) -> CharacterResponse:
    system_prompt = f"""You are {character_name}. {character_personality}

Instructions:
- Stay in character at all times
- Respond naturally as {character_name} would, considering your personality and expertise
- Keep responses conversational but substantial (2-4 sentences typically)
- Build on previous messages in the conversation
- Ask questions or make points that could lead to interesting dialogue
- Respond in JSON format: {{"content": "your response", "shouldContinue": true/false}}
- Set shouldContinue to true if the conversation should naturally continue, false if it feels like a natural ending point"""

    user_message = f"Conversation so far:\n{conversation_history}"
    if user_prompt:
        user_message += f"\n\nUser prompt: {user_prompt}"
    user_message += f"\n\nPlease respond as {character_name}:"

    response = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=1000,
        temperature=0.8,
        system=system_prompt,
        messages=[
            {"role": "user", "content": user_message}
        ]
    )

    try:
        result = json.loads(response.content[0].text)
    except json.JSONDecodeError:
        # If response isn't JSON, wrap it
        result = {"content": response.content[0].text, "shouldContinue": True}
    
    return CharacterResponse(
        content=result.get("content", "I need a moment to think."),
        should_continue=result.get("shouldContinue", True)
    )

async def _generate_with_openai(
    character_name: str,
    character_personality: str,
    conversation_history: str,
    user_prompt: str = None
) -> CharacterResponse:
    system_prompt = f"""You are {character_name}. {character_personality}

Instructions:
- Stay in character at all times
- Respond naturally as {character_name} would, considering your personality and expertise
- Keep responses conversational but substantial (2-4 sentences typically)
- Build on previous messages in the conversation
- Ask questions or make points that could lead to interesting dialogue
- Respond in JSON format: {{"content": "your response", "shouldContinue": true/false}}
- Set shouldContinue to true if the conversation should naturally continue, false if it feels like a natural ending point"""

    user_message = f"Conversation so far:\n{conversation_history}"
    if user_prompt:
        user_message += f"\n\nUser prompt: {user_prompt}"
    user_message += f"\n\nPlease respond as {character_name}:"

    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        response_format={"type": "json_object"},
        temperature=0.8,
    )

    result = json.loads(response.choices[0].message.content or '{"content": "I need a moment to think.", "shouldContinue": false}')
    
    return CharacterResponse(
        content=result.get("content", "I need a moment to think."),
        should_continue=result.get("shouldContinue", True)
    )

async def generate_conversation_title(first_few_messages: str) -> str:
    try:
        if settings.AI_PROVIDER == "anthropic" and anthropic_client:
            return await _generate_title_with_anthropic(first_few_messages)
        elif settings.AI_PROVIDER == "openai" and openai_client:
            return await _generate_title_with_openai(first_few_messages)
        else:
            return "Untitled Conversation"
    except Exception as error:
        print(f"Error generating conversation title: {error}")
        return "Untitled Conversation"

async def _generate_title_with_anthropic(first_few_messages: str) -> str:
    response = anthropic_client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=100,
        temperature=0.7,
        system="Generate a concise, engaging title (2-6 words) for this conversation. Respond in JSON format: {\"title\": \"your title\"}",
        messages=[
            {
                "role": "user",
                "content": f"Conversation excerpt:\n{first_few_messages}"
            }
        ]
    )

    try:
        result = json.loads(response.content[0].text)
        return result.get("title", "Untitled Conversation")
    except json.JSONDecodeError:
        # If response isn't JSON, use the text directly (truncated)
        title = response.content[0].text.strip()
        return title[:50] if len(title) > 50 else title

async def _generate_title_with_openai(first_few_messages: str) -> str:
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": "Generate a concise, engaging title (2-6 words) for this conversation. Respond in JSON format: {\"title\": \"your title\"}"
            },
            {
                "role": "user",
                "content": f"Conversation excerpt:\n{first_few_messages}"
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
    )

    result = json.loads(response.choices[0].message.content or '{"title": "Untitled Conversation"}')
    return result.get("title", "Untitled Conversation")