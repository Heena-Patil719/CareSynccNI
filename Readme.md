# CareSync Project Report

## 1. Acknowledgment
We would like to express our deepest gratitude to all mentors, healthcare professionals, and contributors who guided the development of the CareSync application. Their insights into hospital workflows, traditional medicine terminology, and AI integration were invaluable in shaping a system that is both technically robust and medically relevant. We also extend our appreciation to the open-source community for providing the underlying frameworks that made rapid prototyping possible.

### Aim
The primary aim of the CareSync project is to conceptualize, design, and develop a comprehensive, AI-assisted healthcare management system. It specifically seeks to bridge the critical gap between traditional Indian medicine (NAMASTE classifications) and modern international standards (ICD-11), facilitating a standardized language of health. Simultaneously, the system aims to provide cutting-edge real-time patient monitoring capabilities through intelligent, background vitals alerting.

---

## 2. Abstract
CareSync is a full-stack healthcare web application meticulously engineered to streamline in-patient operations and standardize complex medical coding. The application introduces a sophisticated Patient Management Module coupled with an AI-driven Code Mapping system. By leveraging intelligent background agents, the platform interprets patient vitals in real-time—alerting medical staff instantaneously to critical conditions. Further, it actively assists healthcare administrators in accurately translating and mapping traditional medical treatments to universally recognized medical codes, fostering global interoperability.

### Problem Statement
Healthcare providers utilizing formal traditional medicine standards (such as Ayurveda, Siddha, and Unani) frequently struggle to officially map their diagnoses to international standards like the WHO's ICD-11 framework. This disconnect makes cross-system interoperability, transparent billing, and large-scale epidemiological data analysis exceedingly difficult. Furthermore, busy hospital wards require highly automated, continuous background systems to monitor incoming patient vitals and instinctively flag life-threatening irregularities without relying purely on manual nurse oversight, saving critical response time in life-or-death scenarios where every second counts.

### Problem Solution
CareSync systematically addresses these core challenges through two deeply integrated primary modules:
1. **Intelligent Code Mapping System:** A dedicated, AI-assisted architectural layer designed to seamlessly and intelligently map NAMASTE codes to appropriate ICD-11 chapters by evaluating nuanced symptoms and traditional medicine categories.
2. **Patient Management Module:** A complete, dynamic, and responsive dashboard tailored for managing patient demographics, securely storing medical history, accommodating legacy health records, and continuously tracking live vitals via interactive, trend-analyzing charts.

---

## 3. Agent Used
CareSync integrates two highly specialized background AI agents to automate clinical decision-making. Based on the fundamental types of intelligent agents in Artificial Intelligence, our implementation prominently features:

1. **Vitals Alert Agent (Simple Reflex Agent):**
   - **Type Classification:** *Simple Reflex Agent*. 
   - **Mechanism:** This agent operates purely on the condition-action rule pattern. It evaluates the current incoming percepts (health updates like blood pressure, heart rate, and temperature) independently of historical states.
   - **Functionality:** If a patient's vitals strictly exceed or fall below predefined safe medical thresholds, the agent instantly triggers a condition rule. It automatically classifies the severity (CRITICAL, HIGH, LOW, NORMAL) and dispatches a persistent alert to the main dashboard and the underlying database. It responds directly to the current percept (the raw vitals payload) with an immediate, predetermined action (generating the alert) without maintaining complex internal models of the world.

2. **Code Mapping Agent (Utility-based Agent):**
   - **Type Classification:** *Utility-based Agent*.
   - **Mechanism:** Unlike a simple goal-based agent that merely finds *any* valid mapping, this agent attempts to find the *best* possible mapping by maximizing an internal utility function, which is represented mathematically as a confidence score.
   - **Functionality:** It deeply analyzes complex traditional NAMASTE disease descriptions, symptoms, and categories, navigating the massive possibility space of ICD-11 codes. It evaluates multiple potential matches through the LLM interface, assigns a confidence probability to each candidate, and strictly recommends the most accurate corresponding ICD-11 code. This dramatically reduces manual coding errors and administrative overhead by ensuring that only the highest-utility (most accurate) match is chosen and presented to the medical coder.

---

## 4. Output
The system's real-world functional outputs and deliverables include:
- A responsive, dynamic **Patient Dashboard** offering at-a-glance visibility into live patient statuses, dynamic ward filtering, and structured demographic data presentation.
- A comprehensive **Patient Detail Page** featuring robust graphical trend analysis (powered by visual charting libraries) of a patient's entire vitals history, integrated alert management and conditional acknowledgments, and inline-editable medical information forms.
- A sophisticated **Code Mapping Interface** that securely stores, verifies, and exports cross-system medical code mappings for international compliance.
- **Automated Actionable Alerts** that cleanly persist in a robust MongoDB backend and aggressively notify staff on the React frontend UI, safely distinguishing active critical cases from stable ones via intuitive color-coded badges.

---

## 5. Conclusion
CareSync successfully proves the immense practical viability of integrating agentic AI into high-stakes daily healthcare workflows, maximizing both administrative efficiency and patient safety. By intelligently automating the traditionally tedious and error-prone tasks of cross-system code mapping and raw vitals monitoring, CareSync provides a robust digital safety net. Ultimately, this system empowers medical professionals to offload computational oversight and focus heavily on direct human patient care and rapid emergency response.
