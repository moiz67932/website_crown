"use client"

import dynamic from "next/dynamic"

export { createCustomIcon } from "./icons"

const PropertyMap = dynamic(() => import("./property-map-inner"), { ssr: false })

export default PropertyMap