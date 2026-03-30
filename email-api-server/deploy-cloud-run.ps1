param(
  [string]$PROJECT_ID = "YOUR_PROJECT_ID",
  [string]$REGION = "us-central1",
  [string]$SERVICE = "email-api-server"
)

if ($PROJECT_ID -eq 'YOUR_PROJECT_ID') {
  Write-Error "Please edit the script or pass -PROJECT_ID with your GCP project id."
  exit 1
}

Write-Output "Building and deploying $SERVICE to Cloud Run in project $PROJECT_ID (region $REGION)..."

# Build and push image using Cloud Build
gcloud config set project $PROJECT_ID
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE .

# Deploy to Cloud Run (managed)
gcloud run deploy $SERVICE \
  --image gcr.io/$PROJECT_ID/$SERVICE \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8788

Write-Output "Done. Use 'gcloud run services describe $SERVICE --region $REGION --platform managed' to inspect the service."
