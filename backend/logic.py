import pandas as pd
from sklearn.cluster import KMeans

import re
import pandas as pd
# We will swap KMeans for TF-IDF later in Phase 2.4
from sklearn.cluster import KMeans 

def redact_text(raw_text: str) -> str:
    """
    Phase 2.1: Redacts PII for Responsible AI compliance.
    Never stores the raw message.
    """
    if not raw_text:
        return ""
        
    # 1. Mask Emails (e.g., target@email.com -> [REDACTED_EMAIL])
    text = re.sub(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', '[REDACTED_EMAIL]', raw_text)
    
    # 2. Mask Phone Numbers (Basic international and local formats)
    text = re.sub(r'\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}', '[REDACTED_PHONE]', text)
    
    # 3. Mask Long Numeric Sequences (e.g., Bank Accounts, NRICs - targets 5+ digits)
    text = re.sub(r'\b\d{5,}\b', '[REDACTED_NUMBER]', text)
    
    return text

def get_data_and_cluster(file_path: str, n_clusters: int = 2):
    """
    Reads prompt data from a CSV and applies KMeans clustering.
    """
    try:
        # Load the data Erin will be managing
        df = pd.read_csv(file_path)
        
        # Select only the numerical features for KMeans
        X = df[['feature_1', 'feature_2']]
        
        # Initialize and run the KMeans model with the correct parameter
        model = KMeans(n_clusters=n_clusters, n_init='auto', random_state=42)
        df['cluster'] = model.fit_predict(X)
        
        # Convert the DataFrame back to a list of dictionaries for the API
        return df.to_dict(orient='records')
        
    except FileNotFoundError:
        # Prevents the server from crashing if the CSV is missing
        return [{"error": f"Dataset not found at {file_path}. Please check the data folder."}]
    except Exception as e:
        return [{"error": f"Failed to process data: {str(e)}"}]