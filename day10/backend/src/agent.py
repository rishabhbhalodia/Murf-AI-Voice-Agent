"""
Day 10: Voice Improv Battle
A single-player improv game show with an AI host
"""

import logging
import json
from typing import Annotated
from pathlib import Path

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    WorkerOptions,
    cli,
    metrics,
    tokenize,
    function_tool,
    RunContext
)
from livekit.plugins import silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel
import murf_tts

logger = logging.getLogger("improv_host")
load_dotenv(".env.local")

# Improv scenarios
SCENARIOS = [
    "You are a time-travelling tour guide explaining modern smartphones to someone from the 1800s.",
    "You are a restaurant waiter who must calmly tell a customer that their order has escaped the kitchen.",
    "You are a customer trying to return an obviously cursed object to a very skeptical shop owner.",
    "You are a barista who has to tell a customer that their latte is actually a portal to another dimension.",
    "You are a tech support agent helping an alien understand how to use a toaster.",
    "You are a museum guide explaining why the dinosaur exhibit is currently doing yoga.",
    "You are a pizza delivery person who accidentally delivered to the wrong century.",
    "You are a librarian explaining to a dragon why they can't check out books without a library card."
]

# Game state storage
game_states = {}


class ImprovHostAgent(Agent):
    def __init__(self, session_id: str) -> None:
        # Initialize game state
        if session_id not in game_states:
            game_states[session_id] = {
                "player_name": None,
                "current_round": 0,
                "max_rounds": 3,
                "rounds": [],
                "phase": "intro",
                "current_scenario": None
            }
        
        self.session_id = session_id
        self.state = game_states[session_id]
        
        super().__init__(
            instructions="""You are the energetic and witty host of "IMPROV BATTLE" - a TV improv game show!

🎭 YOUR PERSONALITY:
- High-energy, enthusiastic, and entertaining
- Witty with great comedic timing
- Honest and varied in reactions (not always supportive)
- Sometimes amused, sometimes unimpressed, sometimes pleasantly surprised
- Light teasing is okay, but always respectful
- Think of yourself as a mix between a game show host and an improv coach

🎯 GAME STRUCTURE:
1. INTRO PHASE: Welcome the player by name (already known), explain the game briefly
2. SCENARIO PHASE: Present an improv scenario clearly
3. PERFORMANCE PHASE: Let the player improvise (don't interrupt!)
4. REACTION PHASE: Give honest, varied feedback
5. REPEAT for 3 rounds
6. CLOSING: Summarize their improv style and thank them

📋 HOW TO RUN EACH ROUND:
1. Call get_next_scenario() to get the scenario
2. Present it clearly: "Alright [name], here's your scenario: [scenario]. Ready? Action!"
3. Listen to their performance (they'll say "end scene" or "done" when finished)
4. React honestly using varied tones:
   - Sometimes: "That was hilarious! I loved when you..."
   - Sometimes: "Hmm, that felt a bit rushed. You could have..."
   - Sometimes: "Okay, interesting choice with the..."
   - Mix positive, neutral, and constructive criticism
5. Call record_round_reaction() with your reaction
6. Move to next round or closing

🎬 REACTION GUIDELINES:
- Comment on specific moments from their performance
- Vary your tone: supportive, critical, surprised, amused
- Be honest but constructive
- Mention what worked and what could improve
- The player's name is already known - don't ask for it again
- Keep reactions under 30 words for voice

🏁 CLOSING SUMMARY:
After 3 rounds, summarize:
- Their improv style (character-focused? absurdist? emotional?)
- Memorable moments
- Overall impression
- Thank them for playing

⚡ IMPORTANT:
- The player's name is already known from metadata - use it immediately
- Keep responses conversational and under 30 words
- Don't interrupt during their performance
- Wait for "end scene" or "done" before reacting
- Use their name occasionally
- Be entertaining!

Remember: You're hosting a show, not teaching a class. Make it fun!""",
        )
    
    # @function_tool
    # async def set_player_name(
    #     self,
    #     context: RunContext,
    #     name: Annotated[str, "Player's name"]
    # ):
    #     """Set the player's name at the start of the game.
        
    #     Args:
    #         name: The player's name
    #     """
    #     self.state["player_name"] = name
    #     logger.info(f"Player name set: {name}")
    #     return f"Great! Welcome to Improv Battle, {name}!"
    
    @function_tool
    async def get_next_scenario(self, context: RunContext):
        """Get the next improv scenario for the current round.
        
        Returns the scenario text and updates game state.
        """
        if self.state["current_round"] >= self.state["max_rounds"]:
            return "All rounds complete! Time for the closing summary."
        
        scenario = SCENARIOS[self.state["current_round"] % len(SCENARIOS)]
        self.state["current_scenario"] = scenario
        self.state["phase"] = "awaiting_improv"
        
        logger.info(f"Round {self.state['current_round'] + 1}: {scenario}")
        return scenario
    
    @function_tool
    async def record_round_reaction(
        self,
        context: RunContext,
        reaction: Annotated[str, "Host's reaction to the player's performance"]
    ):
        """Record the host's reaction after a player's improv performance.
        
        Args:
            reaction: The host's feedback/reaction
        """
        self.state["rounds"].append({
            "scenario": self.state["current_scenario"],
            "host_reaction": reaction
        })
        
        self.state["current_round"] += 1
        self.state["phase"] = "intro" if self.state["current_round"] < self.state["max_rounds"] else "done"
        
        logger.info(f"Round {self.state['current_round']} complete. Reaction: {reaction}")
        
        if self.state["current_round"] >= self.state["max_rounds"]:
            return "All rounds complete! Give your closing summary now."
        
        return f"Round {self.state['current_round']} of {self.state['max_rounds']} complete. Ready for the next scenario!"
    
    @function_tool
    async def get_game_status(self, context: RunContext):
        """Get current game status and state.
        
        Returns information about current round, phase, and progress.
        """
        status = {
            "player": self.state["player_name"],
            "round": f"{self.state['current_round']}/{self.state['max_rounds']}",
            "phase": self.state["phase"],
            "rounds_completed": len(self.state["rounds"])
        }
        
        return json.dumps(status)
    
    @function_tool
    async def end_game(self, context: RunContext):
        """End the game early if player wants to stop.
        
        Gracefully closes the improv battle.
        """
        self.state["phase"] = "done"
        logger.info("Game ended early by player")
        return "Thanks for playing Improv Battle! You were great!"


def prewarm(proc: JobProcess):
    """Prewarm the VAD model"""
    proc.userdata["vad"] = silero.VAD.load()

async def entrypoint(ctx: JobContext):
    """Main entrypoint for the Improv Host agent"""
    
    session_id = ctx.room.name
    logger.info(f"Starting Improv Battle for room: {session_id}")
    
    # Initialize game state with placeholder (will update after participant joins)
    if session_id not in game_states:
        game_states[session_id] = {
            "player_name": None,
            "current_round": 0,
            "max_rounds": 3,
            "rounds": [],
            "phase": "intro",
            "current_scenario": None
        }
    
    # Create session with Murf TTS
    session = AgentSession(
        stt=deepgram.STT(
            model="nova-3",
            language="en-US",
        ),
        llm=google.LLM(
            model="gemini-2.0-flash-001",
            temperature=0.8,
        ),
        tts=murf_tts.TTS(
            voice="en-US-ryan",
            style="Conversational",
            tokenizer=tokenize.basic.SentenceTokenizer(
                min_sentence_len=20,
            ),
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
    )
    
    # Metrics collection
    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    # Start the session with Improv Host
    host = ImprovHostAgent(session_id)
    
    await session.start(
        agent=host,
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Join the room FIRST
    await ctx.connect()
    
    # NOW wait for participant and get their name
    logger.info("Waiting for participant to join...")
    await ctx.wait_for_participant()
    
    # Get player name from participant metadata
    player_name = None
    for participant in ctx.room.remote_participants.values():
        if participant.metadata:
            try:
                metadata = json.loads(participant.metadata)
                player_name = metadata.get("player_name")
                if player_name:
                    logger.info(f"Found player name in metadata: {player_name}")
                    game_states[session_id]["player_name"] = player_name
                    break
            except json.JSONDecodeError:
                logger.warning("Could not parse participant metadata")
    
    if not player_name:
        logger.warning("Could not find player name in metadata")

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))