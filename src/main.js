import './style.css'
import OpenAI from 'openai'

document.addEventListener('DOMContentLoaded', () => {
    const rawNotesInput = document.getElementById('rawNotes');
    const generateBtn = document.getElementById('generateBtn');
    const clearBtn = document.getElementById('clearBtn');
    const outputSection = document.getElementById('outputSection');
    const loading = document.getElementById('loading');
    const usageStats = document.getElementById('usageStats');
    const modeBadge = document.getElementById('processingMode');
    
    const summaryContent = document.getElementById('summaryContent');
    const emailContent = document.getElementById('emailContent');

    const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

    let usageCount = parseInt(localStorage.getItem('api_usage_count') || '0');
    updateUsageDisplay();

    function updateUsageDisplay() {
        usageStats.innerText = `API Usage: ${usageCount} generations`;
        localStorage.setItem('api_usage_count', usageCount);
    }

    function setMode(mode, status = 'active') {
        modeBadge.innerText = mode;
        modeBadge.className = `mode-badge ${status}`;
    }

    function getReportDate() {
        const d = new Date();
        const day = d.getDate();
        const month = d.toLocaleString('en-GB', { month: 'long' });
        const year = d.getFullYear();
        const suffix = ["th", "st", "nd", "rd"][(day % 10 > 3 || (day % 100 - day % 10 === 10)) ? 0 : day % 10];
        return `${day}${suffix} ${month} ${year}`;
    }

    const SYSTEM_PROMPT = `
ROLE
You are an expert operations report formatter and data cleaner. 
Your job is to convert raw, messy work notes into a structured, professional daily report.

INPUT
You will receive unstructured raw work notes written quickly during the day. 

IMPORTANT RULE
If the same task appears multiple times in the raw notes, DO NOT MERGE THEM.
Keep them as separate work entries because they represent repeated work done multiple times.

PROCESSING PIPELINE
1. RAW TEXT CLEANING: Fix spelling, expand shorthand (awb -> AWB, inv -> Inventory), and correct grammar.
2. TASK IDENTIFICATION: Split into separate bullet points.
3. TASK STRUCTURING: Use format ACTION + SYSTEM + RESULT (e.g., "Validated delivery orders in the Odoo Inventory module."). Wrap the Action and System in <b> tags.
4. SYSTEM STANDARDIZATION: Use Odoo Inventory Module, Packing Console, Google Merchant Center, Shiprocket, DTDC Portal, Amazon Shipment Portal, ManageEngine, Maintenance Module, Sales Module, POS Module.
5. QUANTITY EXTRACTION: Extract numbers (e.g., "Validated 218 orders").
6. TASK ORDER: Order Processing, Courier/Label, AWB Issues, Customer Care, System/Portal, Website/Product, Data Cleaning, Equipment/Maintenance, Research/Learning, Training, Meetings, Misc.

OUTPUT FORMAT (JSON):
{
  "task_summary": string[],
  "email": {
    "subject": "Today work report update on DD-MM-YYYY",
    "body": "Full professional email draft starting with 'Dear Team,' and ending with 'Best Regards\\nLeela Prasad'."
  }
}

Use short bullet points for summary. No paragraphs in summary.
`;

    async function processWithAI(rawText, apiKey) {
        const isOpenRouter = apiKey.startsWith('sk-or-');
        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: isOpenRouter ? "https://openrouter.ai/api/v1" : "https://api.openai.com/v1",
            dangerouslyAllowBrowser: true,
            defaultHeaders: isOpenRouter ? {
                "HTTP-Referer": window.location.origin,
                "X-Title": "AI Work Report Generator",
            } : {}
        });

        const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

        const response = await openai.chat.completions.create({
            model: isOpenRouter ? "openai/gpt-4o-mini" : "gpt-4o-mini",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `Today's Date: ${today}\nRaw work notes:\n${rawText}` }
            ],
            response_format: { type: "json_object" },
            timeout: 15000 
        });

        usageCount++;
        updateUsageDisplay();
        return JSON.parse(response.choices[0].message.content);
    }

    async function processWithPythonLocal(rawText) {
        try {
            const response = await fetch('http://localhost:5000/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: rawText })
            });

            if (!response.ok) throw new Error("Python server offline");
            const data = await response.json();
            usageCount++; // Local also counts
            updateUsageDisplay();
            return data;
        } catch (err) {
            console.error("Python Fallback Error:", err);
            return null;
        }
    }

    function processNotesBasicJS(rawText) {
        const todayFormatted = getReportDate();
        const lines = rawText.split('\n').filter(l => l.trim());
        return {
            task_summary: lines.map(line => `<b>${line.trim()}</b>`),
            email: {
                subject: `Work Report Update – ${todayFormatted}`,
                body: `Dear Team,\n\nI have completed current tasks.\n\nBest Regards\nLeela Prasad`
            }
        };
    }

    generateBtn.addEventListener('click', async () => {
        const notes = rawNotesInput.value;
        if (!notes) return alert('Please enter some notes first.');

        loading.style.display = 'flex';
        outputSection.style.display = 'none';
        setMode('Processing...', 'loading');

        try {
            let result = null;
            
            // 1. TRY CLOUD AI
            if (OPENAI_API_KEY && !OPENAI_API_KEY.includes('your_api_key_here')) {
                try {
                    result = await processWithAI(notes, OPENAI_API_KEY);
                    setMode('Cloud AI Active');
                } catch (aiErr) {
                    console.error("Cloud AI Failed:", aiErr);
                }
            }

            // 2. TRY PYTHON FALLBACK
            if (!result) {
                result = await processWithPythonLocal(notes);
                if (result) setMode('Local NLP Fallback');
            }

            // 3. TRY BASIC JS
            if (!result) {
                result = processNotesBasicJS(notes);
                setMode('Basic JS (Offline)');
            }
            
            const formattedReportDate = getReportDate();
            
            // Format Summary for Teams/Chat
            const summaryHeader = `<div class="summary-header">Daily Work Report – ${formattedReportDate}</div>`;
            const summaryList = result.task_summary.map(task => `<div class="summary-item">• ${task}</div>`).join('');
            
            summaryContent.innerHTML = summaryHeader + summaryList;
            
            // If AI returned a generic date in subject, replace it
            let subject = result.email.subject;
            if (subject.includes('DD-MM-YYYY') || subject.includes('today') || subject.includes('Today')) {
                subject = `Work Report Update – ${formattedReportDate}`;
            }
            emailContent.innerText = `Subject: ${subject}\n\n${result.email.body}`;

            loading.style.display = 'none';
            outputSection.style.display = 'flex';
            outputSection.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error("Total failure:", error);
            alert("Unexpected error occurred.");
            loading.style.display = 'none';
            setMode('Error', 'error');
        }
    });

    clearBtn.addEventListener('click', () => {
        rawNotesInput.value = '';
        outputSection.style.display = 'none';
        setMode('Standby');
    });
});

window.copyToClipboard = function(id) {
    const element = document.getElementById(id);
    const textToCopy = element.innerText || element.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        const btn = event.target;
        const originalText = btn.innerText;
        btn.innerText = 'Copied!';
        setTimeout(() => btn.innerText = originalText, 2000);
    });
};
