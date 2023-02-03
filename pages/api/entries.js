// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export async function getEntries(req, res) {
  const spaceId = process.env.CONTENTFUL_SPACE_ID
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN

  const response = await fetch(
    `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  const data = await response.json()

  return data
}
