print('-*-*-*-*-*-*-*-*-*-*-**-*-*-*')
print('=== Function start')
print('-*-*-*-*-*-*-*-*-*-*-**-*-*-*')
import json
import os
import urllib.parse
import boto3
import requests
from requests.auth import HTTPBasicAuth

print('Reading in environment variables...')
from dotenv import load_dotenv
from pathlib import Path  # python3 only
env_path = Path('env/') / 'dev.env'
load_dotenv(dotenv_path=env_path)
SOLACE_URI=os.getenv("SOLACE_URI")
SOLACE_PORT=os.getenv("SOLACE_PORT")
SOLACE_USER=os.getenv("SOLACE_USER")
SOLACE_PASSWORD=os.getenv("SOLACE_PASSWORD")
SOLACE_KEEPALIVE=os.getenv("SOLACE_KEEPALIVE")
ROMO_EMOTION_CONTROLLER_PREFIX=os.getenv("ROMO_EMOTION_CONTROLLER_PREFIX")
print('Environment variables set.')

# --------------- Helper Functions to call Rekognition APIs ------------------
rekognition = boto3.client('rekognition')

def detect_faces(bucket, key):
  response = rekognition.detect_faces(Image={"S3Object": {"Bucket": bucket, "Name": key}}, Attributes=['ALL'])
  return response

# 
# Dev note:  
# the demo currently only detects faces, here's the other stuff included in rekognition 
#
# def detect_labels(bucket, key):
#   response = rekognition.detect_labels(Image={"S3Object": {"Bucket": bucket, "Name": key}})

#   # Sample code to write response to DynamoDB table 'MyTable' with 'PK' as Primary Key.
#   # Note: role used for executing this Lambda function should have write access to the table.
#   #table = boto3.resource('dynamodb').Table('MyTable')
#   #labels = [{'Confidence': Decimal(str(label_prediction['Confidence'])), 'Name': label_prediction['Name']} for label_prediction in response['Labels']]
#   #table.put_item(Item={'PK': key, 'Labels': labels})
#   return response


# def index_faces(bucket, key):
#   # Note: Collection has to be created upfront. Use CreateCollection API to create a collecion.
#   #rekognition.create_collection(CollectionId='BLUEPRINT_COLLECTION')
#   response = rekognition.index_faces(Image={"S3Object": {"Bucket": bucket, "Name": key}}, CollectionId="BLUEPRINT_COLLECTION")
#   return response


# --------------- Main handler ------------------ #
def main(event, context):
  '''
  Demonstrates S3 trigger that uses
  Rekognition APIs to detect faces, labels and index faces in S3 Object.
  '''
  # get the image object location from the event
  bucket = event['Records'][0]['s3']['bucket']['name']
  key = urllib.parse.unquote(event['Records'][0]['s3']['object']['key'])
  try:
    # Calls rekognition DetectFaces API to detect faces in S3 object
    response = detect_faces(bucket, key)
    # print rekognition response to console.
    print(response)
    # make a post request to generate an event for the rekognition result
    headers = {'Solace-delivery-mode': 'direct'}
    payload = json.dumps(response)
    topic = key.replace('romo-', 'romo/')
    url = f'{SOLACE_URI}:{SOLACE_PORT}/{ROMO_EMOTION_CONTROLLER_PREFIX}/{topic}'
    r = requests.post(url, auth=HTTPBasicAuth(SOLACE_USER, SOLACE_PASSWORD), data=payload)
    print("Function exiting.")
    return response
  except Exception as e:
    print(e)
    print("Error processing object {} from bucket {}. ".format(key, bucket) +
      "Make sure your object and bucket exist and your bucket is in the same region as this function.")
    raise e

