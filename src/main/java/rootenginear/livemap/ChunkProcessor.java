package rootenginear.livemap;

import net.minecraft.core.world.chunk.Chunk;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import static rootenginear.livemap.ModPaths.CHUNKS_PATH;
import static rootenginear.livemap.ModPaths.CHUNK_LIST_FILE;

public class ChunkProcessor {
	private static final int CHUNK_BLOCKS = 16;

	public static void dumpChunkData(Chunk chunk) throws IOException {
		File chunkFile = ModPaths.CHUNKS_PATH
			.resolve(String.format("%d.%d", chunk.xPosition, chunk.zPosition))
			.toFile();

		try (FileOutputStream chunkData = new FileOutputStream(chunkFile)) {
			for (int shiftZ = 0; shiftZ < CHUNK_BLOCKS; shiftZ++) {
				for (int shiftX = 0; shiftX < CHUNK_BLOCKS; shiftX++) {
					short blockData = 0;
					for (int y = chunk.getHeightValue(shiftX, shiftZ); y > -1; y--) {
						int blockId = chunk.getBlockID(shiftX, y, shiftZ);
						if (blockId != 0) {
							int metadata = chunk.getBlockMetadata(shiftX, y, shiftZ);
							blockData = (short) ((blockId & 0x3FF) | ((metadata & 0xF) << 10));
							break;
						}
					}
					chunkData.write(blockData & 0xFF);
					chunkData.write((blockData >> 8) & 0xFF);
				}
			}
		}
	}

	public static void updateChunkList() throws IOException {
		try (
			DirectoryStream<Path> dp = Files.newDirectoryStream(CHUNKS_PATH);
			FileWriter chunkData = new FileWriter(CHUNK_LIST_FILE)
		) {
			List<String> arr = new ArrayList<>();
			for (Path path : dp) {
				arr.add(
					path
						.getFileName()
						.toString()
				);
			}
			Livemap.GSON.toJson(arr, chunkData);
		}
	}
}
