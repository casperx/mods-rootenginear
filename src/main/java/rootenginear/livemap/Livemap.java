package rootenginear.livemap;

import com.google.gson.Gson;
import net.fabricmc.api.ModInitializer;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Livemap implements ModInitializer {
	public static final String MOD_ID = "livemap";
	public static final Path MOD_DIR = Paths.get(MOD_ID);

	public static final Logger LOGGER = LoggerFactory.getLogger(MOD_ID);
	public static final Gson GSON = new Gson();

	@Override
	public void onInitialize() {
		// create mod directory structures
		ModPaths.onInitialize();

		LOGGER.info("Livemap initialized.");
	}
}
