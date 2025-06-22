import AWS from "aws-sdk";

export async function uploadFileToS3(file: File) {
  try {
    AWS.config.update({
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    });

    const s3 = new AWS.S3({
      params: {
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
      },
      region: "us-east-1",
    });

    const file_key = 'uploads/' + Date.now().toString() + file.name.replace(' ','-')
    const params = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
      Key: file_key,
      Body: file,
    };

    const upload = s3.putObject(params).on("httpUploadProgress", (evt) => {
        console.log("Uplading file to s3 ..."+ parseInt(((evt.loaded*100)/evt.total).toString())+ "%");
    }).promise();

    await upload.then(() => {
      console.log("File uploaded successfully to S3:", file_key);
    })

    return Promise.resolve({
        file_key: file_key,
        file_name: file.name
    })
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    return Promise.reject(error);
  }
}

export function getS3FileUrl(file_key: string) {
  return `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.us-east-1.amazonaws.com/${file_key}`;
}
