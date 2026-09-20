package org.example;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/plan")
@CrossOrigin
public class ArchitecturalPlannerController {

    private final ArchitecturalPlannerService plannerService;

    public ArchitecturalPlannerController(
            ArchitecturalPlannerService plannerService) {
        this.plannerService = plannerService;
    }

    @PostMapping
    public String generatePlan(@RequestBody String requirements) {

        System.out.println("REQUEST RECEIVED:");
        System.out.println(requirements);

        return plannerService.generatePlan(requirements);
    }
}