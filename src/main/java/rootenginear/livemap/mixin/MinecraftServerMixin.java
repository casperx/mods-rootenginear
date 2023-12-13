package rootenginear.livemap.mixin;

import net.minecraft.core.entity.player.EntityPlayer;
import net.minecraft.core.world.chunk.Chunk;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.world.WorldServer;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.Shadow;
import org.spongepowered.asm.mixin.Unique;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfo;
import rootenginear.livemap.ChunkProcessor;
import rootenginear.livemap.Livemap;
import rootenginear.livemap.json.PlayerInfo;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static rootenginear.livemap.ModPaths.PLAYER_LIST_FILE;

@Mixin(value = MinecraftServer.class, remap = false)
public class MinecraftServerMixin {
	@Shadow
	public WorldServer[] worldMngr;

	@Unique
	final int TPS = 20;

	@Unique
	final int CHUNK_DUMP_TIME = 30 * TPS;

	@Unique
	final int PLAYER_DUMP_TIME = 5 * TPS;

	@Unique
	int currentTick = 0;

	@Inject(method = "doTick", at = @At("TAIL"))
	void addTime(CallbackInfo ci) {
		currentTick++;
	}

	@Inject(method = "doTick", at = @At("TAIL"))
	void saveChunk(CallbackInfo ci) throws IOException  {
		if (currentTick % CHUNK_DUMP_TIME != 0) return;

		WorldServer overworld = this.worldMngr[0];

		for (EntityPlayer player : overworld.players) {
			int chunkX = (int) player.x / 16;
			int chunkZ = (int) player.z / 16;

			for (int chunkShiftX = -1; chunkShiftX <= -1; chunkShiftX++) {
				for (int chunkShiftZ = -1; chunkShiftZ <= -1; chunkShiftZ++) {
					int targetChunkX = chunkX + chunkShiftX;
					int targetChunkZ = chunkZ + chunkShiftZ;

					Chunk chunk = overworld.chunkProviderServer.provideChunk(targetChunkX, targetChunkZ);
					ChunkProcessor.dumpChunkData(chunk);
				}
			}
		}

		ChunkProcessor.updateChunkList();
	}

	@Inject(method = "doTick", at = @At("TAIL"))
	void savePlayer(CallbackInfo ci) throws IOException {
		if (currentTick % PLAYER_DUMP_TIME != 0) return;

		List<EntityPlayer> players = this.worldMngr[0].players;
		Map<String, PlayerInfo> obj = new HashMap<>();

        for (EntityPlayer player : players) {
			PlayerInfo p = new PlayerInfo(player.x, player.z);
            obj.put(player.username, p);
        }

		try (FileWriter chunkData = new FileWriter(PLAYER_LIST_FILE)) {
			Livemap.GSON.toJson(obj, chunkData);
		}
	}
}
