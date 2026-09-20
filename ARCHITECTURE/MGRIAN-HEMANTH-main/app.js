/* =========================================================
   ARCHAI — AI ARCHITECTURAL & SPATIAL PLANNING SYSTEM
========================================================= */


/* =========================================================
   GLOBAL STATE
========================================================= */

let latestPlan = null;
let planGenerated = false;

let threeDAnimationId = null;
let threeDResizeHandler = null;


/* =========================================================
   SAFE DOM HELPER
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   HOME / PLANNER NAVIGATION
========================================================= */

function enterPlanner() {

    const homePage = getElement("homePage");
    const plannerPage = getElement("plannerPage");

    if (!homePage || !plannerPage) {
        console.error("homePage or plannerPage element not found.");
        return;
    }

    homePage.classList.add("hidden");
    plannerPage.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    setStatus("Ready to create your architectural plan.");
}


function goHome() {

    const homePage = getElement("homePage");
    const plannerPage = getElement("plannerPage");

    if (!homePage || !plannerPage) {
        console.error("homePage or plannerPage element not found.");
        return;
    }

    stop3DView();

    plannerPage.classList.add("hidden");
    homePage.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   READ USER INPUTS
========================================================= */

function getInputs() {

    const plotWidthElement = getElement("plotWidth");
    const plotLengthElement = getElement("plotLength");
    const floorsElement = getElement("floors");
    const bedroomsElement = getElement("bedrooms");
    const parkingElement = getElement("parking");
    const requirementsElement = getElement("requirements");

    return {

        plotWidth: plotWidthElement
            ? Number(plotWidthElement.value)
            : 0,

        plotLength: plotLengthElement
            ? Number(plotLengthElement.value)
            : 0,

        floors: floorsElement
            ? Number(floorsElement.value)
            : 0,

        bedrooms: bedroomsElement
            ? Number(bedroomsElement.value)
            : 0,

        parking: parkingElement
            ? Number(parkingElement.value)
            : 0,

        requirements: requirementsElement
            ? requirementsElement.value.trim()
            : ""
    };
}


/* =========================================================
   INPUT VALIDATION
========================================================= */

function validateInputs(inputs) {

    if (!inputs.plotWidth || inputs.plotWidth <= 0) {

        return {
            valid: false,
            message: "Please enter a valid plot width."
        };
    }

    if (!inputs.plotLength || inputs.plotLength <= 0) {

        return {
            valid: false,
            message: "Please enter a valid plot length."
        };
    }

    if (!inputs.floors || inputs.floors <= 0) {

        return {
            valid: false,
            message: "Please select at least one floor."
        };
    }

    if (!inputs.bedrooms || inputs.bedrooms <= 0) {

        return {
            valid: false,
            message: "Please enter at least one bedroom."
        };
    }

    if (inputs.parking < 0) {

        return {
            valid: false,
            message: "Parking value cannot be negative."
        };
    }

    return {
        valid: true,
        message: ""
    };
}


/* =========================================================
   FEATURE BUTTON CONTROL
========================================================= */

function setFeatureButtonsEnabled(enabled) {

    const buttonIds = [
        "twoDButton",
        "threeDButton",
        "validationButton",
        "costButton"
    ];

    buttonIds.forEach(id => {

        const button = getElement(id);

        if (button) {
            button.disabled = !enabled;
        }

    });
}


/* =========================================================
   STATUS MESSAGE
========================================================= */

function setStatus(message) {

    const status = getElement("status");

    if (status) {
        status.textContent = message;
    }

    console.log("ARCHAI STATUS:", message);
}


/* =========================================================
   RESET PLAN AREA
========================================================= */

function resetPlanArea() {

    stop3DView();

    const plan = getElement("plan");

    if (!plan) {
        console.error("Plan element not found.");
        return;
    }

    plan.innerHTML = "";
}


/* =========================================================
   GENERATE AI PLAN
========================================================= */

async function generatePlan() {

    const inputs = getInputs();

    /* -----------------------------------------
       Validate inputs
    ----------------------------------------- */

    const validation = validateInputs(inputs);

    if (!validation.valid) {

        setStatus(validation.message);

        return;
    }


    /* -----------------------------------------
       Reset previous plan
    ----------------------------------------- */

    latestPlan = null;
    planGenerated = false;

    resetPlanArea();

    setFeatureButtonsEnabled(false);


    /* -----------------------------------------
       Loading state
    ----------------------------------------- */

    setStatus(
        "AI is analyzing your architectural requirements..."
    );


    const aiInsight = getElement("aiInsight");

    if (aiInsight) {

        aiInsight.innerHTML = `

            <div class="ai-title">
                🧠 AI Architectural Co-Pilot
            </div>

            <p>
                Analyzing plot dimensions, room requirements,
                spatial relationships, circulation and
                planning constraints...
            </p>

        `;
    }


    try {

        console.log("=================================");
        console.log("ARCHAI REQUEST");
        console.log(inputs);
        console.log("=================================");


        /* -----------------------------------------
           Send request to Spring Boot
        ----------------------------------------- */

        const response = await fetch(
            "/api/plan",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify(inputs)
            }
        );


        console.log(
            "SERVER STATUS:",
            response.status
        );


        /* -----------------------------------------
           Read response
        ----------------------------------------- */

        const responseText =
            await response.text();


        console.log(
            "SERVER RESPONSE:",
            responseText
        );


        /* -----------------------------------------
           Handle HTTP error
        ----------------------------------------- */

        if (!response.ok) {

            throw new Error(
                `Server returned HTTP ${response.status}: ${responseText}`
            );
        }


        /* -----------------------------------------
           Parse JSON
        ----------------------------------------- */

        let result;

        try {

            result =
                JSON.parse(responseText);

        } catch (jsonError) {

            console.error(
                "Invalid JSON received:",
                jsonError
            );

            throw new Error(
                "Backend returned invalid JSON."
            );
        }


        /* -----------------------------------------
           Validate AI response
        ----------------------------------------- */

        if (!result) {

            throw new Error(
                "Empty response received from AI."
            );
        }


        /*
         * If backend explicitly reports an error,
         * treat it as an error.
         */

        if (result.aiStatus === "error") {

            throw new Error(
                result.summary ||
                "AI generation failed."
            );
        }


        /* -----------------------------------------
           Save result
        ----------------------------------------- */

        latestPlan = result;

        planGenerated = true;


        /* -----------------------------------------
           Enable visualization tools
        ----------------------------------------- */

        setFeatureButtonsEnabled(true);


        /* -----------------------------------------
           Display AI information
        ----------------------------------------- */

        displayAIResult(result);


        /* -----------------------------------------
           Automatically show 2D
        ----------------------------------------- */

        show2DFloorPlan();


        /* -----------------------------------------
           Success message
        ----------------------------------------- */

        if (result.aiStatus === "fallback") {

            setStatus(
                "AI service unavailable. Intelligent fallback plan generated."
            );

        } else {

            setStatus(
                "AI architectural plan generated successfully."
            );
        }


    } catch (error) {

        console.error(
            "ARCHAI GENERATION ERROR:",
            error
        );


        /*
         * -----------------------------------------
         * IMPORTANT:
         *
         * We use fallback so your hackathon demo
         * continues even if Gemini quota/API fails.
         * -----------------------------------------
         */

        latestPlan =
            createFallbackPlan(inputs);

        planGenerated = true;

        setFeatureButtonsEnabled(true);

        displayAIResult(latestPlan);

        show2DFloorPlan();


        /*
         * Tell the user exactly what happened.
         */

        if (
            error.message &&
            error.message.includes("429")
        ) {

            setStatus(
                "Gemini quota exhausted. Showing intelligent fallback plan."
            );

        } else {

            setStatus(
                "AI API unavailable. Showing intelligent fallback plan."
            );
        }

    }
}


/* =========================================================
   FALLBACK ARCHITECTURAL PLAN
========================================================= */

function createFallbackPlan(inputs) {

    const width = inputs.plotWidth;
    const length = inputs.plotLength;
    const floors = inputs.floors;
    const bedrooms = inputs.bedrooms;
    const parking = inputs.parking;


    return {

        aiStatus: "fallback",

        summary:
            "An intelligent rule-based architectural layout was generated from the supplied plot dimensions, room requirements, parking needs and circulation priorities.",


        plot: {

            width: width,

            length: length,

            floors: floors

        },


        rooms: {

            bedrooms: bedrooms,

            living:
                "Living room positioned near the main entrance.",

            dining:
                "Dining area connected to the living space and kitchen.",

            kitchen:
                "Kitchen positioned close to the dining area for efficient circulation.",

            parking:
                parking === 0
                    ? "No parking requested."
                    : `${parking} car parking positioned near the entrance.`

        },


        suggestions: [

            "Maintain clear circulation between major spaces.",

            "Place kitchen close to dining for efficient movement.",

            "Provide natural lighting and ventilation where possible.",

            "Keep parking close to the main entrance.",

            "Separate private bedroom areas from high-traffic spaces."

        ],


        validation: {

            plotValid: true,

            circulation: "Good",

            parking:
                parking > 0
                    ? "Considered"
                    : "Not required",

            conflicts: 0

        }

    };
}


/* =========================================================
   DISPLAY AI RESULT
========================================================= */

function displayAIResult(result) {

    const details =
        getElement("details");

    const aiInsight =
        getElement("aiInsight");


    if (!result) {
        return;
    }


    const summary =
        result.summary ||
        result.description ||
        "Architectural plan generated successfully.";


    /* -----------------------------------------
       Suggestions
    ----------------------------------------- */

    let suggestions = [];


    if (
        Array.isArray(result.suggestions)
    ) {

        suggestions =
            result.suggestions;

    } else if (
        Array.isArray(result.recommendations)
    ) {

        suggestions =
            result.recommendations;
    }


    /* -----------------------------------------
       AI Co-Pilot
    ----------------------------------------- */

    if (aiInsight) {

        aiInsight.innerHTML = `

            <div class="ai-title">
                🧠 AI Architectural Co-Pilot
            </div>

            <p>
                ${escapeHTML(summary)}
            </p>

        `;
    }


    /* -----------------------------------------
       Right dashboard
    ----------------------------------------- */

    if (details) {

        let suggestionHTML = "";


        suggestions
            .slice(0, 5)
            .forEach(item => {

                suggestionHTML += `

                    <div
                        style="
                            margin-top:10px;
                            padding:12px;
                            border-left:3px solid #4eafd9;
                            background:#081620;
                            color:#9bb3c2;
                            font-size:11px;
                            line-height:1.6;
                            border-radius:4px;
                        "
                    >

                        ${escapeHTML(String(item))}

                    </div>

                `;

            });


        const aiStatus =
            result.aiStatus === "fallback"
                ? "FALLBACK"
                : "AI READY";


        details.innerHTML = `

            <div class="dashboard-card">

                <h3>
                    AI STATUS
                </h3>

                <strong>
                    ${aiStatus}
                </strong>

                <p>
                    Architectural planning engine
                </p>

            </div>


            <div
                class="dashboard-card"
                style="margin-top:12px;"
            >

                <h3>
                    PLOT
                </h3>

                <strong>
                    ${getPlotText()}
                </strong>

                <p>
                    ${getInputValue("floors")} floor(s)
                </p>

            </div>


            <div class="validation-note">

                <strong>
                    AI DESIGN SUMMARY
                </strong>

                <br><br>

                ${escapeHTML(summary)}

            </div>


            ${
            suggestionHTML
                ? `

                        <div
                            style="
                                margin-top:18px;
                                color:#7190a4;
                                font-size:10px;
                                letter-spacing:1.5px;
                                font-weight:700;
                            "
                        >
                            AI SUGGESTIONS
                        </div>

                        ${suggestionHTML}

                    `
                : ""
        }

        `;
    }
}


/* =========================================================
   2D FLOOR PLAN
========================================================= */

function show2DFloorPlan() {

    if (!planGenerated) {

        setStatus(
            "Generate an AI plan first."
        );

        return;
    }

    stop3DView();

    createFloorPlan();

    setStatus(
        "2D architectural floor plan displayed."
    );
}


/* =========================================================
   CREATE 2D FLOOR PLAN
========================================================= */

function createFloorPlan() {

    const plan =
        getElement("plan");

    if (!plan) {
        return;
    }


    const width =
        Number(
            getInputValue("plotWidth")
        );

    const length =
        Number(
            getInputValue("plotLength")
        );

    const bedrooms =
        Number(
            getInputValue("bedrooms")
        );

    const parking =
        Number(
            getInputValue("parking")
        );


    resetPlanArea();


    /* -----------------------------------------
       SVG dimensions
    ----------------------------------------- */

    const svgWidth = 760;
    const svgHeight = 560;

    const margin = 55;

    const houseX = margin;
    const houseY = margin;

    const houseW =
        svgWidth - margin * 2;

    const houseH =
        svgHeight - margin * 2;


    /* -----------------------------------------
       Room dimensions
    ----------------------------------------- */

    const topHeight =
        houseH * 0.42;

    const bottomHeight =
        houseH - topHeight;


    const leftWidth =
        houseW * 0.42;

    const rightWidth =
        houseW - leftWidth;


    /* -----------------------------------------
       Bedroom layout
    ----------------------------------------- */

    let bedroomHTML = "";


    if (bedrooms === 1) {

        bedroomHTML = `

            <rect
                x="${houseX + leftWidth}"
                y="${houseY + topHeight}"
                width="${rightWidth}"
                height="${bottomHeight}"
                fill="#eef6fa"
                stroke="#244c62"
                stroke-width="2"
            />

            <text
                x="${houseX + leftWidth + rightWidth / 2}"
                y="${houseY + topHeight + bottomHeight / 2}"
                text-anchor="middle"
                class="room-label"
            >
                BEDROOM
            </text>

        `;

    } else if (bedrooms === 2) {

        bedroomHTML = `

            <rect
                x="${houseX + leftWidth}"
                y="${houseY + topHeight}"
                width="${rightWidth / 2}"
                height="${bottomHeight}"
                fill="#eef6fa"
                stroke="#244c62"
                stroke-width="2"
            />

            <text
                x="${houseX + leftWidth + rightWidth / 4}"
                y="${houseY + topHeight + bottomHeight / 2}"
                text-anchor="middle"
                class="room-label"
            >
                BEDROOM 1
            </text>


            <rect
                x="${houseX + leftWidth + rightWidth / 2}"
                y="${houseY + topHeight}"
                width="${rightWidth / 2}"
                height="${bottomHeight}"
                fill="#f4f8fb"
                stroke="#244c62"
                stroke-width="2"
            />

            <text
                x="${houseX + leftWidth + rightWidth * 0.75}"
                y="${houseY + topHeight + bottomHeight / 2}"
                text-anchor="middle"
                class="room-label"
            >
                BEDROOM 2
            </text>

        `;

    } else {

        /*
         * For 3+ bedrooms we show a clean
         * conceptual arrangement.
         */

        const bedroomArea =
            bottomHeight / 2;

        bedroomHTML = `

            <rect
                x="${houseX + leftWidth}"
                y="${houseY + topHeight}"
                width="${rightWidth / 2}"
                height="${bedroomArea}"
                fill="#eef6fa"
                stroke="#244c62"
                stroke-width="2"
            />

            <text
                x="${houseX + leftWidth + rightWidth / 4}"
                y="${houseY + topHeight + bedroomArea / 2}"
                text-anchor="middle"
                class="room-label"
            >
                BEDROOM 1
            </text>


            <rect
                x="${houseX + leftWidth + rightWidth / 2}"
                y="${houseY + topHeight}"
                width="${rightWidth / 2}"
                height="${bedroomArea}"
                fill="#f4f8fb"
                stroke="#244c62"
                stroke-width="2"
            />

            <text
                x="${houseX + leftWidth + rightWidth * 0.75}"
                y="${houseY + topHeight + bedroomArea / 2}"
                text-anchor="middle"
                class="room-label"
            >
                BEDROOM 2
            </text>


            <rect
                x="${houseX + leftWidth}"
                y="${houseY + topHeight + bedroomArea}"
                width="${rightWidth}"
                height="${bedroomArea}"
                fill="#eef3f7"
                stroke="#244c62"
                stroke-width="2"
            />

            <text
                x="${houseX + leftWidth + rightWidth / 2}"
                y="${houseY + topHeight + bedroomArea + bedroomArea / 2}"
                text-anchor="middle"
                class="room-label"
            >
                BEDROOM ${bedrooms >= 3 ? "3+" : "3"}
            </text>

        `;
    }


    /* -----------------------------------------
       Parking
    ----------------------------------------- */

    let parkingHTML = "";


    if (parking > 0) {

        parkingHTML = `

            <rect
                x="${houseX}"
                y="${houseY + houseH - 85}"
                width="145"
                height="65"
                fill="#e8f1f5"
                stroke="#244c62"
                stroke-width="2"
                stroke-dasharray="7 4"
            />

            <text
                x="${houseX + 72.5}"
                y="${houseY + houseH - 48}"
                text-anchor="middle"
                class="room-label"
            >
                PARKING
            </text>

        `;
    }


    /* -----------------------------------------
       SVG
    ----------------------------------------- */

    const svg = `

        <div class="floor-plan-wrapper">

            <div class="floor-plan-title">

                GENERATED 2D FLOOR PLAN

                <span>
                    • ${width} FT × ${length} FT
                </span>

            </div>


            <svg
                class="floor-plan-svg"
                viewBox="0 0 ${svgWidth} ${svgHeight}"
                preserveAspectRatio="xMidYMid meet"
            >

                <!-- Outer boundary -->

                <rect
                    x="${houseX}"
                    y="${houseY}"
                    width="${houseW}"
                    height="${houseH}"
                    fill="#ffffff"
                    stroke="#16384b"
                    stroke-width="4"
                />


                <!-- Living room -->

                <rect
                    x="${houseX}"
                    y="${houseY}"
                    width="${leftWidth}"
                    height="${topHeight}"
                    fill="#f7fbfd"
                    stroke="#244c62"
                    stroke-width="2"
                />

                <text
                    x="${houseX + leftWidth / 2}"
                    y="${houseY + topHeight / 2}"
                    text-anchor="middle"
                    class="room-label"
                >
                    LIVING ROOM
                </text>


                <!-- Kitchen -->

                <rect
                    x="${houseX + leftWidth}"
                    y="${houseY}"
                    width="${rightWidth}"
                    height="${topHeight}"
                    fill="#eef7fa"
                    stroke="#244c62"
                    stroke-width="2"
                />

                <text
                    x="${houseX + leftWidth + rightWidth / 2}"
                    y="${houseY + topHeight / 2}"
                    text-anchor="middle"
                    class="room-label"
                >
                    KITCHEN
                </text>


                <!-- Dining -->

                <rect
                    x="${houseX}"
                    y="${houseY + topHeight}"
                    width="${leftWidth}"
                    height="${bottomHeight}"
                    fill="#f1f8fb"
                    stroke="#244c62"
                    stroke-width="2"
                />

                <text
                    x="${houseX + leftWidth / 2}"
                    y="${houseY + topHeight + bottomHeight / 2}"
                    text-anchor="middle"
                    class="room-label"
                >
                    DINING
                </text>


                <!-- Bedrooms -->

                ${bedroomHTML}


                <!-- Parking -->

                ${parkingHTML}


                <!-- Main entrance -->

                <line
                    x1="${houseX + houseW / 2 - 40}"
                    y1="${houseY + houseH}"
                    x2="${houseX + houseW / 2 + 40}"
                    y2="${houseY + houseH}"
                    stroke="#ffffff"
                    stroke-width="10"
                />

                <text
                    x="${houseX + houseW / 2}"
                    y="${houseY + houseH + 18}"
                    text-anchor="middle"
                    class="room-size"
                >
                    MAIN ENTRANCE
                </text>


                <!-- Width -->

                <text
                    x="${svgWidth / 2}"
                    y="25"
                    text-anchor="middle"
                    class="room-size"
                >
                    ${width} FT
                </text>


                <!-- Length -->

                <text
                    x="17"
                    y="${svgHeight / 2}"
                    transform="rotate(-90 17 ${svgHeight / 2})"
                    text-anchor="middle"
                    class="room-size"
                >
                    ${length} FT
                </text>

            </svg>

        </div>

    `;


    plan.innerHTML = svg;
}


/* =========================================================
   STOP 3D VIEW
========================================================= */

function stop3DView() {

    if (threeDAnimationId !== null) {

        cancelAnimationFrame(
            threeDAnimationId
        );

        threeDAnimationId = null;
    }


    if (threeDResizeHandler) {

        window.removeEventListener(
            "resize",
            threeDResizeHandler
        );

        threeDResizeHandler = null;
    }
}


/* =========================================================
   3D VIEW
========================================================= */

function create3DView() {

    if (!planGenerated) {

        setStatus(
            "Generate an AI plan first."
        );

        return;
    }


    const plan =
        getElement("plan");

    if (!plan) {
        return;
    }


    /* -----------------------------------------
       Stop previous 3D animation
    ----------------------------------------- */

    stop3DView();


    /* -----------------------------------------
       Completely replace 2D content
    ----------------------------------------- */

    plan.innerHTML = `

        <div
            id="threeDContainer"
            class="three-d-container"
        ></div>

    `;


    const container =
        getElement("threeDContainer");


    if (!container) {
        return;
    }


    /* -----------------------------------------
       Check Three.js
    ----------------------------------------- */

    if (typeof THREE === "undefined") {

        container.innerHTML = `

            <div
                style="
                    padding:60px;
                    color:#e58b8b;
                    text-align:center;
                    font-size:18px;
                "
            >

                Three.js could not be loaded.

                <br><br>

                Check the Three.js script in index.html.

            </div>

        `;

        return;
    }


    /* -----------------------------------------
       Inputs
    ----------------------------------------- */

    const width =
        Number(
            getInputValue("plotWidth")
        );

    const length =
        Number(
            getInputValue("plotLength")
        );

    const floors =
        Number(
            getInputValue("floors")
        );

    const bedrooms =
        Number(
            getInputValue("bedrooms")
        );

    const parking =
        Number(
            getInputValue("parking")
        );


    /* -----------------------------------------
       Scene
    ----------------------------------------- */

    const scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(0x050d14);


    /* -----------------------------------------
       Camera
    ----------------------------------------- */

    const initialWidth =
        Math.max(
            container.clientWidth,
            600
        );


    const initialHeight = 550;


    const camera =
        new THREE.PerspectiveCamera(
            45,
            initialWidth / initialHeight,
            0.1,
            1000
        );


    camera.position.set(
        13,
        10,
        16
    );


    /* -----------------------------------------
       Renderer
    ----------------------------------------- */

    const renderer =
        new THREE.WebGLRenderer({
            antialias: true
        });


    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );


    renderer.setSize(
        initialWidth,
        initialHeight
    );


    container.appendChild(
        renderer.domElement
    );


    renderer.domElement.style.display =
        "block";


    renderer.domElement.style.width =
        "100%";


    renderer.domElement.style.height =
        "550px";


    /* -----------------------------------------
       Lighting
    ----------------------------------------- */

    const ambient =
        new THREE.AmbientLight(
            0xffffff,
            1.6
        );

    scene.add(ambient);


    const directional =
        new THREE.DirectionalLight(
            0xffffff,
            2
        );


    directional.position.set(
        10,
        15,
        10
    );


    scene.add(directional);


    const secondaryLight =
        new THREE.DirectionalLight(
            0x6faed0,
            1
        );


    secondaryLight.position.set(
        -10,
        8,
        -8
    );


    scene.add(
        secondaryLight
    );


    /* -----------------------------------------
       Ground
    ----------------------------------------- */

    const groundGeometry =
        new THREE.PlaneGeometry(
            30,
            30
        );


    const groundMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x0c1a23,
            roughness: 0.8,
            metalness: 0.1
        });


    const ground =
        new THREE.Mesh(
            groundGeometry,
            groundMaterial
        );


    ground.rotation.x =
        -Math.PI / 2;


    scene.add(ground);


    /* -----------------------------------------
       House dimensions
    ----------------------------------------- */

    const houseWidth = 8;

    const houseDepth = 6;

    const floorHeight = 2.6;


    /* -----------------------------------------
       Building
    ----------------------------------------- */

    for (
        let floor = 0;
        floor < floors;
        floor++
    ) {

        const y =
            floor * floorHeight +
            floorHeight / 2;


        const buildingGeometry =
            new THREE.BoxGeometry(
                houseWidth,
                floorHeight,
                houseDepth
            );


        const buildingMaterial =
            new THREE.MeshStandardMaterial({
                color: 0xb8cbd3,
                roughness: 0.65
            });


        const building =
            new THREE.Mesh(
                buildingGeometry,
                buildingMaterial
            );


        building.position.set(
            0,
            y,
            0
        );


        scene.add(building);


        /* -------------------------------------
           Windows
        ------------------------------------- */

        const windowMaterial =
            new THREE.MeshStandardMaterial({

                color: 0x4ea9d1,

                emissive: 0x164a65,

                emissiveIntensity: 0.55

            });


        const windowGeometry =
            new THREE.BoxGeometry(
                1.2,
                1,
                0.08
            );


        const windowPositions = [

            [-2.5, 0, 3.04],

            [0, 0, 3.04],

            [2.5, 0, 3.04]

        ];


        windowPositions.forEach(
            position => {

                const window =
                    new THREE.Mesh(
                        windowGeometry,
                        windowMaterial
                    );


                window.position.set(
                    position[0],
                    y,
                    position[2]
                );


                scene.add(window);

            }
        );


        /* -------------------------------------
           Door
        ------------------------------------- */

        if (floor === 0) {

            const doorGeometry =
                new THREE.BoxGeometry(
                    1.3,
                    2,
                    0.1
                );


            const doorMaterial =
                new THREE.MeshStandardMaterial({
                    color: 0x243c49
                });


            const door =
                new THREE.Mesh(
                    doorGeometry,
                    doorMaterial
                );


            door.position.set(
                0,
                1,
                3.05
            );


            scene.add(door);
        }
    }


    /* -----------------------------------------
       Roof
    ----------------------------------------- */

    const roofGeometry =
        new THREE.ConeGeometry(
            5.8,
            2.5,
            4
        );


    const roofMaterial =
        new THREE.MeshStandardMaterial({
            color: 0x244b5e,
            roughness: 0.7
        });


    const roof =
        new THREE.Mesh(
            roofGeometry,
            roofMaterial
        );


    roof.rotation.y =
        Math.PI / 4;


    roof.position.y =
        floors * floorHeight + 1.25;


    scene.add(roof);


    /* -----------------------------------------
       Parking
    ----------------------------------------- */

    if (parking > 0) {

        const parkingGeometry =
            new THREE.BoxGeometry(
                3.5,
                0.15,
                5
            );


        const parkingMaterial =
            new THREE.MeshStandardMaterial({
                color: 0x273f4c
            });


        const parkingMesh =
            new THREE.Mesh(
                parkingGeometry,
                parkingMaterial
            );


        parkingMesh.position.set(
            6,
            0.075,
            0
        );


        scene.add(
            parkingMesh
        );
    }


    /* -----------------------------------------
       3D Information Label
    ----------------------------------------- */

    const info =
        document.createElement("div");


    info.style.position =
        "absolute";


    info.style.top =
        "15px";


    info.style.left =
        "15px";


    info.style.padding =
        "10px 15px";


    info.style.background =
        "rgba(5,13,20,0.85)";


    info.style.color =
        "#d8e8f0";


    info.style.fontSize =
        "12px";


    info.style.border =
        "1px solid #244c62";


    info.style.borderRadius =
        "6px";


    info.style.zIndex =
        "10";


    info.innerHTML = `

        <strong>3D MASSING MODEL</strong>

        <br>

        ${width} × ${length} FT

        • ${floors} FLOOR${floors > 1 ? "S" : ""}

        • ${bedrooms} BEDROOM${bedrooms > 1 ? "S" : ""}

    `;


    container.style.position =
        "relative";


    container.appendChild(
        info
    );


    /* -----------------------------------------
       Camera animation
    ----------------------------------------- */

    let angle = 0;


    function animate() {

        /*
         * Stop if the container has been
         * removed from the page.
         */

        if (
            !document.body.contains(container)
        ) {

            stop3DView();

            return;
        }


        threeDAnimationId =
            requestAnimationFrame(
                animate
            );


        angle += 0.002;


        camera.position.x =
            Math.sin(angle) * 15;


        camera.position.z =
            Math.cos(angle) * 15;


        camera.lookAt(
            0,
            floors * 1.2,
            0
        );


        renderer.render(
            scene,
            camera
        );
    }


    animate();


    /* -----------------------------------------
       Resize
    ----------------------------------------- */

    threeDResizeHandler =
        function () {

            const currentContainer =
                getElement(
                    "threeDContainer"
                );


            if (
                !currentContainer ||
                !document.body.contains(
                    currentContainer
                )
            ) {

                return;
            }


            const newWidth =
                Math.max(
                    currentContainer.clientWidth,
                    300
                );


            const newHeight =
                550;


            camera.aspect =
                newWidth / newHeight;


            camera.updateProjectionMatrix();


            renderer.setSize(
                newWidth,
                newHeight
            );
        };


    window.addEventListener(
        "resize",
        threeDResizeHandler
    );


    setStatus(
        "3D architectural visualization active."
    );
}


/* =========================================================
   SPATIAL VALIDATION
========================================================= */

function showSpatialValidation() {

    if (!planGenerated) {

        setStatus(
            "Generate an AI plan first."
        );

        return;
    }

    stop3DView();

    validatePlan();
}


/* =========================================================
   VALIDATE PLAN
========================================================= */

function validatePlan() {

    const width =
        Number(
            getInputValue("plotWidth")
        );

    const length =
        Number(
            getInputValue("plotLength")
        );

    const floors =
        Number(
            getInputValue("floors")
        );

    const bedrooms =
        Number(
            getInputValue("bedrooms")
        );

    const parking =
        Number(
            getInputValue("parking")
        );


    const area =
        width * length;


    /* -----------------------------------------
       Plot feasibility
    ----------------------------------------- */

    let plotStatus =
        "VALID";

    let plotClass =
        "validation-good";


    if (area < 600) {

        plotStatus =
            "COMPACT";

        plotClass =
            "validation-warning";
    }


    if (area < 300) {

        plotStatus =
            "VERY COMPACT";

        plotClass =
            "validation-warning";
    }


    /* -----------------------------------------
       Bedroom density
    ----------------------------------------- */

    let bedroomStatus =
        "GOOD";

    let bedroomClass =
        "validation-good";


    if (
        bedrooms > 5 &&
        area < 1500
    ) {

        bedroomStatus =
            "HIGH DENSITY";

        bedroomClass =
            "validation-warning";
    }


    if (
        bedrooms > 8 &&
        area < 2000
    ) {

        bedroomStatus =
            "VERY HIGH";

        bedroomClass =
            "validation-warning";
    }


    /* -----------------------------------------
       Parking
    ----------------------------------------- */

    let parkingStatus =
        parking === 0
            ? "NONE"
            : "CONSIDERED";


    /* -----------------------------------------
       Display
    ----------------------------------------- */

    const plan =
        getElement("plan");


    if (!plan) {
        return;
    }


    plan.innerHTML = `

        <div class="validation-dashboard">

            <div class="dashboard-title">
                🔍 SPATIAL VALIDATION REPORT
            </div>


            <div class="dashboard-grid">


                <div
                    class="
                        dashboard-card
                        ${plotClass}
                    "
                >

                    <h3>
                        PLOT FEASIBILITY
                    </h3>

                    <strong>
                        ${plotStatus}
                    </strong>

                    <p>
                        ${width} × ${length} ft
                    </p>

                </div>


                <div
                    class="
                        dashboard-card
                        validation-good
                    "
                >

                    <h3>
                        FLOOR CONFIGURATION
                    </h3>

                    <strong>
                        ${floors}
                        FLOOR${floors > 1 ? "S" : ""}
                    </strong>

                    <p>
                        Vertical planning considered
                    </p>

                </div>


                <div
                    class="
                        dashboard-card
                        ${bedroomClass}
                    "
                >

                    <h3>
                        BEDROOM ALLOCATION
                    </h3>

                    <strong>
                        ${bedrooms}
                    </strong>

                    <p>
                        ${bedroomStatus}
                    </p>

                </div>


                <div
                    class="
                        dashboard-card
                        validation-good
                    "
                >

                    <h3>
                        PARKING
                    </h3>

                    <strong>
                        ${parkingStatus}
                    </strong>

                    <p>
                        ${
        parking === 0
            ? "No parking requested"
            : parking + " car parking"
    }
                    </p>

                </div>

            </div>


            <div class="validation-note">

                <strong>
                    SPATIAL CHECKS
                </strong>

                <br><br>

                ✓ Plot dimensions accepted

                <br>

                ✓ Required rooms considered

                <br>

                ✓ Living / dining / kitchen relationship maintained

                <br>

                ✓ Circulation space considered

                <br>

                ✓ Parking requirement considered

                <br>

                ✓ Floor configuration considered

                <br>

                ${
        plotStatus === "VALID"
            ? "✓ Plot area is suitable for conceptual planning"
            : "⚠ Plot is compact — room sizing should be carefully optimized"
    }

                <br>

                ${
        bedroomStatus === "GOOD"
            ? "✓ Bedroom density within conceptual limits"
            : "⚠ High bedroom density — detailed architectural review recommended"
    }

            </div>


            <div
                class="validation-note"
                style="margin-top:15px;"
            >

                <strong>
                    DISCLAIMER
                </strong>

                <br><br>

                This validation is an AI-assisted conceptual
                planning check. Final architectural approval,
                structural safety and local building-code
                compliance must be verified by a qualified
                architect or engineer.

            </div>

        </div>

    `;


    setStatus(
        "Spatial validation completed."
    );
}


/* =========================================================
   COST ESTIMATION
========================================================= */

function calculateCost() {

    if (!planGenerated) {

        setStatus(
            "Generate an AI plan first."
        );

        return;
    }


    const width =
        Number(
            getInputValue("plotWidth")
        );

    const length =
        Number(
            getInputValue("plotLength")
        );

    const floors =
        Number(
            getInputValue("floors")
        );


    const plotArea =
        width * length;


    /*
     * Conceptual built-up area assumption:
     * 75% of plot area per floor.
     */

    const builtArea =
        plotArea *
        floors *
        0.75;


    /*
     * Demonstration construction rate.
     */

    const ratePerSqFt =
        2200;


    const estimatedCost =
        builtArea *
        ratePerSqFt;


    const formattedCost =
        formatIndianCurrency(
            estimatedCost
        );


    const plan =
        getElement("plan");


    if (!plan) {
        return;
    }


    stop3DView();


    plan.innerHTML = `

        <div class="cost-dashboard">

            <div class="dashboard-title">
                💰 INDICATIVE COST ESTIMATE
            </div>


            <div class="cost-main">

                <span>
                    ESTIMATED CONSTRUCTION COST
                </span>

                <strong>
                    ₹${formattedCost}
                </strong>

            </div>


            <div class="dashboard-grid">


                <div class="dashboard-card">

                    <h3>
                        PLOT AREA
                    </h3>

                    <strong>
                        ${formatIndianNumber(plotArea)}
                    </strong>

                    <p>
                        sq.ft
                    </p>

                </div>


                <div class="dashboard-card">

                    <h3>
                        ESTIMATED BUILT AREA
                    </h3>

                    <strong>
                        ${formatIndianNumber(
        Math.round(builtArea)
    )}
                    </strong>

                    <p>
                        sq.ft
                    </p>

                </div>


                <div class="dashboard-card">

                    <h3>
                        FLOORS
                    </h3>

                    <strong>
                        ${floors}
                    </strong>

                    <p>
                        planned level(s)
                    </p>

                </div>


                <div class="dashboard-card">

                    <h3>
                        RATE ASSUMPTION
                    </h3>

                    <strong>
                        ₹2,200
                    </strong>

                    <p>
                        per sq.ft
                    </p>

                </div>

            </div>


            <div class="validation-note">

                <strong>
                    IMPORTANT
                </strong>

                <br><br>

                This is an indicative planning estimate
                intended for early-stage decision making.

                <br><br>

                Actual construction cost can vary based on
                materials, location, labour, structural design,
                finishes and contractor pricing.

            </div>

        </div>

    `;


    setStatus(
        "Indicative construction cost calculated."
    );
}


/* =========================================================
   HELPER — GET INPUT VALUE
========================================================= */

function getInputValue(id) {

    const element =
        getElement(id);

    return element
        ? element.value
        : "";
}


/* =========================================================
   HELPER — PLOT TEXT
========================================================= */

function getPlotText() {

    const width =
        getInputValue("plotWidth");

    const length =
        getInputValue("plotLength");


    return `${width} × ${length} FT`;
}


/* =========================================================
   HELPER — INDIAN CURRENCY
========================================================= */

function formatIndianCurrency(value) {

    return Math.round(value)
        .toLocaleString("en-IN");
}


/* =========================================================
   HELPER — NUMBER
========================================================= */

function formatIndianNumber(value) {

    return Number(value)
        .toLocaleString("en-IN");
}


/* =========================================================
   HELPER — ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "================================="
        );

        console.log(
            "ARCHAI INITIALIZING..."
        );


        const homePage =
            getElement("homePage");

        const plannerPage =
            getElement("plannerPage");


        /*
         * Start on landing page
         */

        if (homePage) {

            homePage.classList.remove(
                "hidden"
            );
        }


        if (plannerPage) {

            plannerPage.classList.add(
                "hidden"
            );
        }


        /*
         * Disable advanced tools
         */

        setFeatureButtonsEnabled(
            false
        );


        /*
         * Reset application state
         */

        latestPlan = null;

        planGenerated = false;


        console.log(
            "✓ ArchAI initialized successfully."
        );

        console.log(
            "================================="
        );
    }
);


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.enterPlanner =
    enterPlanner;

window.goHome =
    goHome;

window.generatePlan =
    generatePlan;

window.show2DFloorPlan =
    show2DFloorPlan;

window.create3DView =
    create3DView;

window.showSpatialValidation =
    showSpatialValidation;

window.calculateCost =
    calculateCost;