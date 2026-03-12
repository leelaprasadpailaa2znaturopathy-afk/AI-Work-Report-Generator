from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob
import datetime
import re

app = Flask(__name__)
CORS(app)

# Dictionary for Master Prompt System Standardization
SYSTEM_STANDARDIZATION = {
    'odoo': 'Odoo Inventory Module',
    'packing console': 'Packing Console',
    'google merchant': 'Google Merchant Center',
    'shiprocket': 'Shiprocket',
    'dtdc': 'DTDC Portal',
    'amazon': 'Amazon Shipment Portal',
    'manageengine': 'ManageEngine',
    'maintenance': 'Maintenance Module',
    'sales': 'Sales Module',
    'pos': 'POS Module',
    'awb': 'AWB'
}

def clean_and_professionalize(text):
    # 1. Manual Shorthand Cleanup
    replacements = {
        r'\brtraining\b': 'training',
        r'\brresponsove\b': 'responsive',
        r'\bnoyt\b': 'not',
        r'\busingm\b': 'using',
        r'\bhte\b': 'the',
        r'\bform\b': 'from',
        r'\bmaintaince\b': 'maintenance',
        r'\binv\b': 'Inventory'
    }
    
    for pattern, replacement in replacements.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)

    # 2. Context-aware Cleanup
    text = re.sub(r'\bequipments\b', 'equipment', text, flags=re.IGNORECASE)
    
    # 3. Spell correction (TextBlob)
    blob = TextBlob(text)
    corrected = str(blob.correct())
    
    # 4. Final Polish & Highlighting & System Standardization
    processed_text = corrected
    for short, full in SYSTEM_STANDARDIZATION.items():
        # Match case-insensitively but replace with bolded standardized name
        pattern = re.compile(re.escape(short), re.IGNORECASE)
        processed_text = pattern.sub(f"<b>{full}</b>", processed_text)
            
    # Professional sentence capitalization
    sentence = processed_text.strip()
    if not sentence.endswith('.'):
        sentence += '.'
        
    if len(sentence) > 0:
        # Avoid capitalizing the <b> tag starting character
        return sentence[0].upper() + sentence[1:]
    return sentence

@app.route('/process', methods=['POST'])
def process_notes():
    data = request.json
    raw_notes = data.get('notes', '')
    today_date = datetime.datetime.now().strftime("%d-%m-%Y")
    
    lines = [line.strip() for line in raw_notes.split('\n') if line.strip()]
    
    # Stronger logic for generating professional summary
    task_summary = []
    for line in lines:
        cleaned = clean_and_professionalize(line)
        task_summary.append(cleaned)
    
    email_body = f"Dear Team,\n\nI have successfully completed the following tasks today:\n"
    for task in task_summary:
        email_body += f"- {task.replace('<b>', '').replace('</b>', '')}\n"
    
    email_body += "\nAll reported issues have been addressed.\n\nBest Regards\nLeela Prasad"
    
    return jsonify({
        "task_summary": task_summary,
        "email": {
            "subject": f"Today work report update on {today_date}",
            "body": email_body
        }
    })

if __name__ == '__main__':
    print("NLP Fallback Service started on http://127.0.0.1:5000")
    app.run(port=5000)
