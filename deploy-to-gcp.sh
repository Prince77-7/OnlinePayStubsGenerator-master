# Deploy to Google Cloud Run
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/paystub-generator
gcloud run deploy paystub-generator --image gcr.io/YOUR_PROJECT_ID/paystub-generator --platform managed --region us-central1 --allow-unauthenticated
