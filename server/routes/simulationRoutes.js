const express = require("express");
const Simulation = require("../models/Simulation");
const User = require("../models/User");
const authenticateToken = require("../middleware/authMiddleware");
const xpService = require("../services/xpService");
const badgeService = require("../services/badgeService");

const router = express.Router();

// Get all simulations
router.get("/", authenticateToken, async (req, res) => {
	try {
		const simulations = await Simulation.find({}).sort({ createdAt: -1 });
		res.json(simulations);
	} catch (error) {
		console.error("Error fetching simulations:", error);
		res.status(500).json({
			success: false,
			message: "Failed to fetch simulations",
		});
	}
});

// Get simulations by subject
router.get("/subject/:subject", authenticateToken, async (req, res) => {
	try {
		const { subject } = req.params;
		const simulations = await Simulation.find({ subject }).sort({
			createdAt: -1,
		});
		res.json(simulations);
	} catch (error) {
		console.error("Error fetching simulations:", error);
		res.status(500).json({
			success: false,
			message: "Failed to fetch simulations",
		});
	}
});

// Get simulation by slug
router.get("/slug/:slug", async (req, res) => {
	try {
		const { slug } = req.params;
		console.log("Fetching simulation with slug:", slug);
		const simulation = await Simulation.findOne({ slug });
		
		if (!simulation) {
			return res.status(404).json({
				success: false,
				message: "Simulation not found"
			});
		}
		
		res.json({
			success: true,
			simulation
		});
	} catch (error) {
		console.error("Error fetching simulation by slug:", error);
		res.status(500).json({
			success: false,
			message: "Failed to fetch simulation",
		});
	}
});

// Search simulations by keywords
router.get("/search/:keywords", async (req, res) => {
	try {
		const { keywords } = req.params;
		
		// Create search regex for flexible matching
		const searchRegex = new RegExp(keywords.split(' ').join('|'), 'i');
		
		const simulations = await Simulation.find({
			$or: [
				{ title: searchRegex },
				{ category: searchRegex },
				{ tags: { $in: [searchRegex] } },
				{ description: searchRegex }
			]
		})
		.limit(3) // Limit to 3 most relevant simulations
		.sort({ createdAt: -1 });
		
		res.json({
			success: true,
			simulations,
			count: simulations.length
		});
	} catch (error) {
		console.error("Error searching simulations:", error);
		res.status(500).json({
			success: false,
			message: "Failed to search simulations",
		});
	}
});

// Create sample simulations (for development/testing)
router.post("/seed", authenticateToken, async (req, res) => {
	try {
		// Check if simulations already exist
		const existingCount = await Simulation.countDocuments();
		if (existingCount > 0) {
			return res.json({
				success: false,
				message: "Sample data already exists",
			});
		}

		const sampleSimulations = [
			{
				title: "Projectile Motion Simulator",
				subject: "Physics",
				category: "Mechanics",
				iframeUrl: "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_en.html",
				downloadUrl: "https://phet.colorado.edu/en/simulation/projectile-motion",
				description: "Explore projectile motion by launching objects with different angles and velocities. Observe how gravity affects the trajectory.",
				tags: ["motion", "gravity", "physics"],
				difficulty: "Beginner"
			},
			{
				title: "Chemical Bonds Simulation",
				subject: "Chemistry",
				category: "Molecular Structure",
				iframeUrl: "https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_en.html",
				downloadUrl: "https://phet.colorado.edu/en/simulation/molecule-shapes",
				description: "Build molecules and understand how atomic bonds affect molecular geometry and polarity.",
				tags: ["molecules", "bonds", "chemistry"],
				difficulty: "Intermediate"
			},
			{
				title: "DNA Replication Lab",
				subject: "Biology",
				category: "Genetics",
				iframeUrl: "https://www.labxchange.org/library/items/lb:LabXchange:d8d6789d:lx_simulation:1",
				downloadUrl: "https://www.labxchange.org/library/items/lb:LabXchange:d8d6789d:lx_simulation:1",
				description: "Step through the process of DNA replication and see how genetic information is copied.",
				tags: ["DNA", "genetics", "biology"],
				difficulty: "Advanced"
			},
			{
				title: "Graphing Calculator",
				subject: "Mathematics",
				category: "Algebra",
				iframeUrl: "https://www.desmos.com/calculator",
				downloadUrl: "https://www.desmos.com/calculator",
				description: "Interactive graphing calculator to visualize mathematical functions and equations.",
				tags: ["graphing", "functions", "algebra"],
				difficulty: "Beginner"
			},
			{
				title: "Circuit Simulator",
				subject: "Physics",
				category: "Electricity",
				iframeUrl: "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html",
				downloadUrl: "https://phet.colorado.edu/en/simulation/circuit-construction-kit-dc",
				description: "Build circuits with batteries, resistors, and other components to understand electrical flow.",
				tags: ["circuits", "electricity", "physics"],
				difficulty: "Intermediate"
			},
			{
				title: "Acid-Base Solutions",
				subject: "Chemistry",
				category: "Solutions",
				iframeUrl: "https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_en.html",
				downloadUrl: "https://phet.colorado.edu/en/simulation/acid-base-solutions",
				description: "Explore the pH scale and see how different solutions affect acidity and basicity.",
				tags: ["pH", "acids", "bases", "chemistry"],
				difficulty: "Intermediate"
			}
		];

		const createdSimulations = await Simulation.insertMany(sampleSimulations);
		res.json({
			success: true,
			message: `${createdSimulations.length} sample simulations created`,
			simulations: createdSimulations
		});
	} catch (error) {
		console.error("Error creating sample simulations:", error);
		res.status(500).json({
			success: false,
			message: "Failed to create sample simulations",
		});
	}
});

// Mark simulation as completed and award XP
router.post("/complete/:simulationId", authenticateToken, async (req, res) => {
	try {
		const { simulationId } = req.params;
		const userId = req.user.id;
		
		// Check if simulation exists
		const simulation = await Simulation.findById(simulationId);
		if (!simulation) {
			return res.status(404).json({
				success: false,
				message: "Simulation not found"
			});
		}

		// Get user and update completed simulations count
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found"
			});
		}

		// Update user stats
		user.completedSimulations = (user.completedSimulations || 0) + 1;
		await user.save();

		// Award XP for simulation completion
		const xpResult = await xpService.awardXP(userId, 'simulation_completed');
		
		// Check for new badges
		const newBadges = await badgeService.checkAndAwardBadges(userId);

		res.json({
			success: true,
			message: "Simulation completed successfully",
			simulation: {
				id: simulation._id,
				title: simulation.title,
				subject: simulation.subject
			},
			xpAwarded: xpResult.xpAwarded || 0,
			levelInfo: xpResult.levelInfo,
			leveledUp: xpResult.leveledUp || false,
			newBadges: newBadges || [],
			totalSimulationsCompleted: user.completedSimulations
		});
	} catch (error) {
		console.error("Error completing simulation:", error);
		res.status(500).json({
			success: false,
			message: "Failed to complete simulation",
			error: error.message
		});
	}
});

module.exports = router;
