// For SVG files when imported as a URL/path for <img> tags
declare module "*.svg" {
  const content: string
  export default content
}

// For PNG files when imported as a URL/path for <img> tags
declare module "*.png" {
  const content: string
  export default content
}

// You can add other image types similarly if needed:
declare module "*.jpg" {
  const content: string
  export default content
}

declare module "*.jpeg" {
  const content: string
  export default content
}

declare module "*.gif" {
  const content: string
  export default content
}
