package rootenginear.livemap;

import java.io.File;
import java.nio.file.Path;

import static rootenginear.livemap.Livemap.MOD_DIR;

public class ModPaths {
    public static final Path CHUNKS_PATH = MOD_DIR.resolve("chunks");
    public static final File CHUNK_LIST_FILE = MOD_DIR
        .resolve("chunks.json")
        .toFile();
    public static final File PLAYER_LIST_FILE = MOD_DIR
        .resolve("players.json")
        .toFile();

    public static void onInitialize() {
        MOD_DIR
            .toFile()
            .mkdirs();
        CHUNKS_PATH
            .toFile()
            .mkdirs();
    }
}
