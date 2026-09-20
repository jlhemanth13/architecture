package org.example;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import org.springframework.stereotype.Service;

@Service
public class ArchitecturalPlannerService {

    private final Client client;

    public ArchitecturalPlannerService() {
        client = new Client();
    }

    public String generatePlan(String requirements) {

        String prompt = """
                You are an AI architectural planning assistant.

                Analyze the following house planning requirements:

                %s

                Return ONLY a structured JSON object.

                The JSON must contain:
                - plotWidth
                - plotLength
                - floors
                - parking
                - setbacks
                - rooms
                - relationships
                - suggestions

                For rooms, organize them floor-wise.

                Include practical spatial relationships such as:
                - Living Room near Entrance
                - Kitchen near Dining
                - Bedrooms near Bathrooms
                - Parking near Entrance
                - Staircase connected to floor circulation

                Do NOT provide final room coordinates.
                Do NOT claim that the design is legally or professionally approved.

                The application will perform its own spatial validation.
                """.formatted(requirements);

        try {

            System.out.println("======================================");
            System.out.println("SENDING REQUEST TO GEMINI...");
            System.out.println("======================================");

            GenerateContentResponse response =
                    client.models.generateContent(
                            "gemini-3.8-flash",
                            prompt,
                            null
                    );

            String result = response.text();

            System.out.println("GEMINI RESPONSE RECEIVED");

            return result;

        } catch (Exception e) {

            System.out.println("======================================");
            System.out.println("GEMINI API ERROR");
            System.out.println(e.getMessage());
            System.out.println("USING FALLBACK PLAN");
            System.out.println("======================================");

            return createFallbackPlan(requirements);
        }
    }

    private String createFallbackPlan(String requirements) {

        return """
                {
                  "aiStatus": "fallback",
                  "message": "Gemini AI is temporarily unavailable. A deterministic conceptual planning configuration has been generated so the application can continue functioning.",

                  "plotWidth": 40,
                  "plotLength": 60,

                  "floors": 2,

                  "parking": {
                    "spaces": 1,
                    "type": "Covered car parking",
                    "recommendedDimensions": "10 ft x 18 ft"
                  },

                  "setbacks": {
                    "front": "10 ft",
                    "rear": "5 ft",
                    "sideLeft": "4 ft",
                    "sideRight": "4 ft"
                  },

                  "rooms": {
                    "groundFloor": [
                      {
                        "name": "Living Room",
                        "type": "Public",
                        "primaryUse": "Family gathering and guest reception"
                      },
                      {
                        "name": "Dining Area",
                        "type": "Semi-Public",
                        "primaryUse": "Dining and family interaction"
                      },
                      {
                        "name": "Kitchen",
                        "type": "Service",
                        "primaryUse": "Cooking and food preparation"
                      },
                      {
                        "name": "Bedroom 1",
                        "type": "Private",
                        "primaryUse": "Ground floor bedroom"
                      },
                      {
                        "name": "Common Bathroom",
                        "type": "Service",
                        "primaryUse": "Common bathroom"
                      },
                      {
                        "name": "Staircase",
                        "type": "Circulation",
                        "primaryUse": "Vertical circulation"
                      },
                      {
                        "name": "Utility",
                        "type": "Service",
                        "primaryUse": "Laundry and utility activities"
                      }
                    ],

                    "firstFloor": [
                      {
                        "name": "Master Bedroom",
                        "type": "Private",
                        "primaryUse": "Primary bedroom"
                      },
                      {
                        "name": "Bedroom 3",
                        "type": "Private",
                        "primaryUse": "Secondary bedroom"
                      },
                      {
                        "name": "Family Lounge",
                        "type": "Semi-Private",
                        "primaryUse": "Family relaxation or study"
                      },
                      {
                        "name": "Bathroom",
                        "type": "Service",
                        "primaryUse": "Bedroom bathroom"
                      },
                      {
                        "name": "Balcony",
                        "type": "Outdoor",
                        "primaryUse": "Outdoor relaxation"
                      }
                    ]
                  },

                  "relationships": [
                    {
                      "source": "Parking",
                      "target": "Entrance",
                      "relationship": "Direct access"
                    },
                    {
                      "source": "Living Room",
                      "target": "Entrance",
                      "relationship": "Near main entrance"
                    },
                    {
                      "source": "Kitchen",
                      "target": "Dining Area",
                      "relationship": "Direct adjacency"
                    },
                    {
                      "source": "Bedroom",
                      "target": "Bathroom",
                      "relationship": "Convenient access"
                    },
                    {
                      "source": "Staircase",
                      "target": "First Floor",
                      "relationship": "Vertical circulation"
                    }
                  ],

                  "suggestions": [
                    "Keep Living and Dining connected for better circulation.",
                    "Place Kitchen close to Dining for efficient movement.",
                    "Keep bedrooms in quieter private zones.",
                    "Maintain direct access between Parking and Entrance.",
                    "Use the staircase as the main vertical circulation element.",
                    "Provide ventilation and natural lighting through setback areas."
                  ]
                }
                """;
    }
}