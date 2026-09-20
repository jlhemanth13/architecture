import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;

public class GeminiTest {

    public static void main(String[] args) {

        Client client = new Client();

        GenerateContentResponse response =
                client.models.generateContent(
                        "gemini-3.8-flash",
                        "Say hello and confirm that the Gemini API is working.",
                        null
                );

        System.out.println("Gemini Response:");
        System.out.println(response.text());
    }
}


