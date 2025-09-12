import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Play, Search, Filter, X, Maximize, Minimize, Download, ArrowLeft, Beaker, Atom, Dna, Calculator, Zap, Star, Crown, Target, ExternalLink } from 'lucide-react';
import AutoText from './AutoText';

const Simulations = () => {
	const navigate = useNavigate();
	const [simulations, setSimulations] = useState([]);
	const [selectedSimulation, setSelectedSimulation] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [selectedSubjects, setSelectedSubjects] = useState(new Set());
	const [selectedCategories, setSelectedCategories] = useState(new Set());
	const [categoriesBySubject, setCategoriesBySubject] = useState({});
	const [searchQuery, setSearchQuery] = useState("");
	const [showFilters, setShowFilters] = useState(false);
const beurl=import.meta.env.VITE_BACKEND_URL;
	const subjects = [
		{ name: "Physics", icon: Atom, color: "from-blue-600 to-indigo-600" },
		{ name: "Chemistry", icon: Beaker, color: "from-green-600 to-emerald-600" },
		{ name: "Biology", icon: Dna, color: "from-purple-600 to-pink-600" },
		{ name: "Mathematics", icon: Calculator, color: "from-orange-600 to-red-600" }
	];

	useEffect(() => {
		fetchSimulations();
	}, []);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.key === "Escape" && isFullscreen) {
				toggleFullscreen();
			}
		};

		if (isFullscreen) {
			document.addEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "auto";
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "auto";
		};
	}, [isFullscreen]);

	const fetchSimulations = async () => {
		try {
			const token =
				localStorage.getItem("token") || sessionStorage.getItem("token");
			const response = await fetch(`${beurl}/api/simulations`, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch simulations");
			}

			const data = await response.json();
			setSimulations(data);

			// Extract categories for each subject
			const categoriesMap = {};
			data.forEach((sim) => {
				if (!categoriesMap[sim.subject]) {
					categoriesMap[sim.subject] = new Set();
				}
				categoriesMap[sim.subject].add(sim.category);
			});

			// Convert sets to arrays
			const finalCategoriesMap = {};
			Object.keys(categoriesMap).forEach((subject) => {
				finalCategoriesMap[subject] = Array.from(categoriesMap[subject]);
			});

			setCategoriesBySubject(finalCategoriesMap);
		} catch (err) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const handleSimulationClick = (simulation) => {
		setSelectedSimulation(simulation);
	};

	const handleCloseSimulation = () => {
		setSelectedSimulation(null);
		setIsFullscreen(false);
	};

	const toggleFullscreen = () => {
		setIsFullscreen(!isFullscreen);
	};

	const handleDownload = () => {
		if (selectedSimulation && selectedSimulation.downloadUrl) {
			window.open(selectedSimulation.downloadUrl, '_blank');
		} else {
			alert('Download not available for this simulation');
		}
	};

	const handleSubjectChange = (subject, checked) => {
		const newSelectedSubjects = new Set(selectedSubjects);
		const newSelectedCategories = new Set(selectedCategories);

		if (checked) {
			newSelectedSubjects.add(subject);
			if (categoriesBySubject[subject]) {
				categoriesBySubject[subject].forEach((cat) =>
					newSelectedCategories.add(cat)
				);
			}
		} else {
			newSelectedSubjects.delete(subject);
			if (categoriesBySubject[subject]) {
				categoriesBySubject[subject].forEach((cat) =>
					newSelectedCategories.delete(cat)
				);
			}
		}

		setSelectedSubjects(newSelectedSubjects);
		setSelectedCategories(newSelectedCategories);
	};

	const handleCategoryChange = (category, checked) => {
		const newSelectedCategories = new Set(selectedCategories);

		if (checked) {
			newSelectedCategories.add(category);
		} else {
			newSelectedCategories.delete(category);
		}

		setSelectedCategories(newSelectedCategories);
	};

	const filteredSimulations = simulations.filter((sim) => {
		const matchesSubjects = selectedSubjects.size === 0 || selectedSubjects.has(sim.subject);
		const matchesCategories = selectedCategories.size === 0 || selectedCategories.has(sim.category);
		const matchesFilters = matchesSubjects && matchesCategories;

		const matchesSearch = searchQuery === "" ||
			sim.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			sim.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			sim.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
			sim.category.toLowerCase().includes(searchQuery.toLowerCase());

		return matchesFilters && matchesSearch;
	});

	if (loading) {
		return (
			<div className="w-full h-full flex items-center justify-center p-4 relative">
				{/* Animated particles */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					{[...Array(20)].map((_, i) => (
						<div
							key={i}
							className="absolute animate-pulse"
							style={{
								left: `${Math.random() * 100}%`,
								top: `${Math.random() * 100}%`,
								animationDelay: `${Math.random() * 3}s`,
								animationDuration: `${2 + Math.random() * 2}s`
							}}
						>
							<Star className="w-2 h-2 text-pink-400 opacity-60" />
						</div>
					))}
				</div>

				<div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden w-full max-w-md">
					<div className="flex items-center justify-center space-x-3 mb-4">
						<div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full shadow-lg transform hover:scale-110 transition-transform duration-300">
							<Zap className="w-8 h-8 text-white" />
						</div>
					</div>
					<div className="text-center">
						<AutoText className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
							Loading Simulations
						</AutoText>
						<div className="w-full bg-white/20 rounded-full h-2 overflow-hidden mt-4">
							<div className="bg-gradient-to-r from-purple-600 to-pink-600 h-full rounded-full animate-pulse"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full h-full flex items-center justify-center p-4 relative">
				{/* Animated particles */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					{[...Array(20)].map((_, i) => (
						<div
							key={i}
							className="absolute animate-pulse"
							style={{
								left: `${Math.random() * 100}%`,
								top: `${Math.random() * 100}%`,
								animationDelay: `${Math.random() * 3}s`,
								animationDuration: `${2 + Math.random() * 2}s`
							}}
						>
							<Star className="w-2 h-2 text-pink-400 opacity-60" />
						</div>
					))}
				</div>

				<div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden w-full max-w-md">
					<div className="flex items-center justify-center space-x-3 mb-4">
						<div className="bg-gradient-to-r from-red-600 to-pink-600 p-4 rounded-full shadow-lg transform hover:scale-110 transition-transform duration-300">
							<X className="w-8 h-8 text-white" />
						</div>
					</div>
					<div className="text-center">
						<AutoText className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
							Error Loading
						</AutoText>
						<p className="text-white/80">{error}</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full h-full flex items-center justify-center px-5 py-4 relative">
			{/* Animated particles */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				{[...Array(30)].map((_, i) => (
					<div
						key={i}
						className="absolute animate-pulse"
						style={{
							left: `${Math.random() * 100}%`,
							top: `${Math.random() * 100}%`,
							animationDelay: `${Math.random() * 3}s`,
							animationDuration: `${2 + Math.random() * 2}s`
						}}
					>
						<Star className="w-2 h-2 text-pink-400 opacity-60" />
					</div>
				))}
			</div>

			{!selectedSimulation ? (
				<div className="backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden w-full">
					{/* Header */}
					<div className="flex items-center justify-between mb-8">
						<div className="flex items-center space-x-4">
							<div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-full shadow-lg transform hover:scale-110 transition-transform duration-300">
								<Beaker className="w-8 h-8 text-white" />
							</div>
							<div>
								<h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
									<AutoText>Educational Simulations</AutoText>
								</h1>
								<p className="text-white/80">
									<AutoText>Explore interactive learning experiences</AutoText>
								</p>
							</div>
						</div>
						<button
							onClick={() => setShowFilters(!showFilters)}
							className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
								showFilters 
									? 'bg-purple-600/30 border-purple-500/50 text-purple-200' 
									: 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
							} border backdrop-blur-sm`}
						>
							<Filter className="w-4 h-4" />
							<AutoText>Filters</AutoText>
						</button>
					</div>

					{/* Search Bar */}
					<div className="relative mb-6">
						<Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
						<input
							type="text"
							placeholder="Search simulations..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-12 pr-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-sm transition-all duration-300"
						/>
					</div>

					{/* Filters Section */}
					{showFilters && (
						<div className="mb-6 p-4 bg-white/5 rounded-xl border border-purple-500/20">
							<h3 className="text-lg font-semibold text-white mb-4">
								<AutoText>Filter by Subject</AutoText>
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
								{subjects.map((subject) => {
									const IconComponent = subject.icon;
									return (
										<label
											key={subject.name}
											className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-all duration-300"
										>
											<input
												type="checkbox"
												checked={selectedSubjects.has(subject.name)}
												onChange={(e) => handleSubjectChange(subject.name, e.target.checked)}
												className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
											/>
											<IconComponent className="w-5 h-5 text-purple-400" />
											<span className="text-white">{subject.name}</span>
										</label>
									);
								})}
							</div>
						</div>
					)}

					{/* Simulations Grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
						{filteredSimulations.length > 0 ? (
							filteredSimulations.map((simulation) => (
								<div
									key={simulation._id}
									className="group p-6 bg-white/10 hover:bg-white/20 border border-purple-500/30 hover:border-purple-400/50 rounded-xl transition-all duration-300 backdrop-blur-sm hover:scale-105 hover:shadow-xl"
								>
									<div className="flex items-start justify-between mb-4">
										<div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-300">
											<Play className="w-6 h-6 text-white" />
										</div>
										<span className="px-3 py-1 bg-purple-600/30 text-purple-200 text-xs font-medium rounded-full">
											{simulation.subject}
										</span>
									</div>
									<h3 
										onClick={() => handleSimulationClick(simulation)}
										className="text-xl font-bold text-white mb-2 group-hover:text-purple-200 transition-colors duration-300 cursor-pointer"
									>
										{simulation.title}
									</h3>
									<p className="text-white/70 text-sm mb-4 line-clamp-2">
										{simulation.description}
									</p>
									<div className="flex items-center justify-between mb-3">
										<span className="text-white/50 text-xs">
											{simulation.category}
										</span>
										<div className="flex items-center space-x-1">
											<Star className="w-4 h-4 text-yellow-400" />
											<span className="text-white/70 text-sm">4.5</span>
										</div>
									</div>
									<div className="flex items-center justify-between gap-2">
										<button
											onClick={() => handleSimulationClick(simulation)}
											className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center gap-2"
										>
											<Play className="w-4 h-4" />
											Quick View
										</button>
										<button
											onClick={() => navigate(`/simulation/${simulation.slug}`)}
											className="bg-white/20 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-white/30 transition-all duration-200 flex items-center justify-center gap-2"
										>
											<ExternalLink className="w-4 h-4" />
											Full Page
										</button>
									</div>
								</div>
							))
						) : (
							<div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
								<Target className="w-16 h-16 text-white/30 mb-4" />
								<h3 className="text-xl font-semibold text-white/70 mb-2">
									<AutoText>No simulations found</AutoText>
								</h3>
								<p className="text-white/50">
									<AutoText>Try adjusting your search or filters</AutoText>
								</p>
							</div>
						)}
					</div>
				</div>
			) : (
				// Full-screen Simulation Viewer with glassmorphic design
				<div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'w-full h-full'} backdrop-blur-xl bg-black/40 border border-purple-500/30 rounded-3xl shadow-2xl relative overflow-hidden`}>
					{/* Header */}
					<div className="flex items-center justify-between p-4 border-b border-purple-500/30 bg-black/20">
						<div className="flex items-center space-x-4">
							<button
								onClick={handleCloseSimulation}
								className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-purple-500/30 rounded-xl text-white transition-all duration-300 backdrop-blur-sm"
							>
								<ArrowLeft className="w-4 h-4" />
								<AutoText>Back</AutoText>
							</button>
							<div>
								<h2 className="text-xl font-bold text-white">{selectedSimulation.title}</h2>
								<p className="text-white/70 text-sm">{selectedSimulation.subject} • {selectedSimulation.category}</p>
							</div>
						</div>
						<div className="flex items-center space-x-3">
							<button
								onClick={handleDownload}
								className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 rounded-xl text-green-200 transition-all duration-300 backdrop-blur-sm"
							>
								<Download className="w-4 h-4" />
								<AutoText>Download</AutoText>
							</button>
							{/* <button
								onClick={toggleFullscreen}
								className="flex items-center space-x-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 rounded-xl text-blue-200 transition-all duration-300 backdrop-blur-sm"
							>
								{!isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
								<AutoText>{isFullscreen ? 'Fullscreen' : 'Exit Fullscreen'}</AutoText>
							</button> */}
						</div>
					</div>

					{/* Simulation Iframe - Takes full remaining space */}
					<div className={`relative ${isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[calc(100vh-200px)]'}`}>
						{isFullscreen && (
							<button
								onClick={toggleFullscreen}
								className="absolute top-4 right-4 z-50 p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg transition-all duration-300 border border-white/20"
								title="Exit Fullscreen (ESC)"
							>
								<X className="w-6 h-6" />
							</button>
						)}
						<iframe
							src={selectedSimulation.iframeUrl}
							title={selectedSimulation.title}
							className="w-full h-full border-0 rounded-b-3xl"
							allowFullScreen
						/>
					</div>

					{/* Description - Only show when not fullscreen */}
					{!isFullscreen && (
						<div className="p-6 bg-black/10">
							<h3 className="text-lg font-semibold text-white mb-3">
								<AutoText>About this Simulation</AutoText>
							</h3>
							<p className="text-white/80 leading-relaxed">
								{selectedSimulation.description}
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default Simulations;