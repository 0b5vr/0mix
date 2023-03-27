export const MTL_NONE = 0;

/**
 * no need to set params
 */
export const MTL_UNLIT = 1;

/**
 * vec4( roughness, metallic, emissive, cubemap )
 */
export const MTL_PBR_ROUGHNESS_METALLIC = 2;

/**
 * vec4( emissiveRGB, roughness )
 * if roughness is negative, use full metallic
 */
export const MTL_PBR_EMISSIVE3_ROUGHNESS = 3;

/**
 * vec4( sheenTint, sheenRoughness )
 */
export const MTL_PBR_SHEEN = 4;

/**
 * vec4( roughness, metallic, mix, reserved )
 */
export const MTL_IRIDESCENT = 5;
