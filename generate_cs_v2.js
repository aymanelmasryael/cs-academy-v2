const fs = require('fs');

const topics = [
    "Data Structures", "Algorithms", "System Design", "Networking", 
    "Operating Systems", "Databases", "Distributed Systems", "Security",
    "Machine Learning", "Software Engineering", "Cloud Computing"
];
const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert", "Interview"];
const types = ["Conceptual", "Practical", "Architecture", "Design Decisions", "Code Writing", "Debugging"];

const numQuestions = 10000;
const generatedData = [];

console.log("Generating 10,000 CS Questions for V2 Academy...");

for (let i = 1; i <= numQuestions; i++) {
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const id = "CS-" + i.toString().padStart(6, '0');

    const obj = {
        id: id,
        question: "Question " + i + ": Explain the trade-offs of using " + topic + " in a high-throughput environment.",
        detailedAnswer: "Detailed Answer for " + topic + ": In high-throughput environments, the primary concern is reducing latency and avoiding bottlenecks. When implementing " + topic + ", you must consider time vs space complexity.",
        whyCorrect: "This answer correctly identifies the core constraint of high-throughput systems.",
        whyIncorrect: "Answers that ignore latency or suggest monolithic bottlenecks are incorrect.",
        realWorldExample: "// Example of " + topic + "\npublic void ProcessStream() {\n    // Implementation details\n}",
        commonMistakes: "1. Not anticipating scale. 2. Ignoring garbage collection overhead.",
        bestPractices: "Always benchmark " + topic + " under load. Use connection pooling where appropriate.",
        relatedConcepts: [topic, "Scalability", "Throughput"],
        difficulty: difficulty,
        estimatedReadingTime: Math.floor(Math.random() * 5) + 2 + " mins",
        relatedReferences: ["Designing Data-Intensive Applications", "CLRS Algorithms"],
        interviewRelevance: (difficulty === "Interview" || difficulty === "Expert") ? "High" : "Medium",
        tags: [topic, type],
        source: "AEL CS Academy Dataset V2",
        type: type,
        relationships: {
            learningOutcome: "Master scaling principles in " + topic,
            exercise: "Implement a concurrent version of " + topic + ".",
            challenge: "Optimize this " + topic + " implementation to run in O(1) time.",
            interview: "How would you scale " + topic + " to 1 million users?"
        }
    };

    generatedData.push(obj);
}

const fileContent = "const academyData = " + JSON.stringify(generatedData, null, 2) + ";\n\nwindow.academyData = academyData;";
fs.writeFileSync('data.js', fileContent);

console.log("Successfully generated " + numQuestions + " items in data.js");
