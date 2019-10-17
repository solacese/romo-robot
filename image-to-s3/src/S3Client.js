import S3 from "aws-sdk/clients/s3";
import uuidv1 from "uuid/v1";

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

export function uploadFile(file) {
  // generate unique uuid for object
  const uuid = uuidv1();
  const objKey = `${process.env.S3_KEY_PREFIX}-${uuid}.jpg`;

  const params = {
    Body: file, 
    Bucket: process.env.AWS_S3_BUCKET,
    ContentType: "image/jpeg",
    Key: objKey
   };

    s3.upload(params, (err, data) => {
      if (err) throw err
      console.log(`File uploaded successfully to ${data.Location}`)
      return true;
    });
}
