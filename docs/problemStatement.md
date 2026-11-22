# AI-Powered Restaurant Recommendation System (Zomato Use Case)

You are tasked with building an AI-powered restaurant recommendation service.

## Objective

Design and implement an application that:

- Takes user preferences (such as location, budget, cuisine, and ratings)
- Uses a real-world dataset of restaurants
- Leverages an LLM to generate personalized, human-like recommendations
- Displays clear and useful results to the user

## System Workflow

### 1. Data Ingestion

- Load and preprocess the Zomato dataset from Hugging Face
- Extract relevant fields such as restaurant name, location, cuisine, cost, and rating

### 2. User Input

Collect user preferences:

- **Location** (e.g., Bangalore)
- **Budget** (low, medium, high)
- **Cuisine** (e.g., Italian, Chinese)
- **Minimum rating**
- **Additional preferences** (e.g., family-friendly, quick service)

### 3. Integration Layer

- Filter and prepare relevant restaurant data based on user input
- Pass structured results into an LLM prompt
- Design a prompt that helps the LLM reason and rank options

### 4. Recommendation Engine

Use the LLM to:

- Rank restaurants
- Provide explanations (why each recommendation fits)
- Optionally summarize choices

### 5. Output Display

Present top recommendations in a user-friendly format:

| Field | Description |
| --- | --- |
| Restaurant Name | Name of the recommended restaurant |
| Cuisine | Cuisine type(s) offered |
| Rating | Restaurant rating |
| Estimated Cost | Approximate cost aligned with budget |
| AI-generated explanation | Why this restaurant matches the user's preferences |

## Project Context

This project is an end-to-end AI recommendation system that combines structured data filtering with LLM-based reasoning. The pipeline starts with a real Zomato restaurant dataset, applies preference-based filters, and then uses an LLM to rank and explain the best matches in natural language.

The goal is not only to return matching restaurants, but to produce personalized recommendations that feel human and useful — with clear rationale for each suggestion.
