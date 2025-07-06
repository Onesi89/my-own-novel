/**
 * Google Places API (New) Service
 * FSD: features/map/api
 * 
 * 새로운 Google Places API를 사용한 장소 검색 서비스
 * https://developers.google.com/maps/documentation/places/web-service/overview
 */

export interface PlaceSearchResult {
  placeId: string
  name: string
  address: string
  location: {
    lat: number
    lng: number
  }
  types: string[]
  rating?: number
  priceLevel?: number
  photoUrls?: string[]
  openingHours?: string[]
  phoneNumber?: string
  website?: string
}

export interface PlaceAutocompleteResult {
  placeId: string
  displayName: string
  formattedAddress: string
  types: string[]
}

export interface PlaceDetailsResult extends PlaceSearchResult {
  reviews?: Array<{
    author: string
    rating: number
    text: string
    time: string
  }>
  businessStatus?: string
  userRatingsTotal?: number
}

class PlacesService {
  private apiKey: string
  private baseUrl = 'https://places.googleapis.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * 장소 자동완성 검색
   * https://developers.google.com/maps/documentation/places/web-service/autocomplete
   */
  async autocomplete(
    query: string,
    locationBias?: { lat: number; lng: number; radius: number },
    countryCode = 'KR'
  ): Promise<PlaceAutocompleteResult[]> {
    const url = `${this.baseUrl}/places:autocomplete`
    
    const requestBody = {
      input: query,
      locationBias: locationBias ? {
        circle: {
          center: {
            latitude: locationBias.lat,
            longitude: locationBias.lng
          },
          radius: locationBias.radius
        }
      } : undefined,
      includedRegionCodes: [countryCode],
      languageCode: 'ko'
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat,suggestions.placePrediction.types'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Places API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return data.suggestions?.map((suggestion: any) => ({
        placeId: suggestion.placePrediction.placeId,
        displayName: suggestion.placePrediction.text.text,
        formattedAddress: suggestion.placePrediction.structuredFormat.mainText.text,
        types: suggestion.placePrediction.types || []
      })) || []
    } catch (error) {
      console.error('Places autocomplete error:', error)
      throw error
    }
  }

  /**
   * 장소 상세 정보 조회
   * https://developers.google.com/maps/documentation/places/web-service/details
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResult> {
    const url = `${this.baseUrl}/places/${placeId}`
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,types,rating,priceLevel,photos,currentOpeningHours,nationalPhoneNumber,websiteUri,reviews,businessStatus,userRatingCount'
        }
      })

      if (!response.ok) {
        throw new Error(`Places API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        placeId: data.id,
        name: data.displayName?.text || '',
        address: data.formattedAddress || '',
        location: {
          lat: data.location?.latitude || 0,
          lng: data.location?.longitude || 0
        },
        types: data.types || [],
        rating: data.rating,
        priceLevel: data.priceLevel,
        photoUrls: data.photos?.map((photo: any) => 
          `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=400&maxWidthPx=400&key=${this.apiKey}`
        ) || [],
        openingHours: data.currentOpeningHours?.weekdayDescriptions || [],
        phoneNumber: data.nationalPhoneNumber,
        website: data.websiteUri,
        reviews: data.reviews?.map((review: any) => ({
          author: review.authorAttribution?.displayName || '',
          rating: review.rating || 0,
          text: review.text?.text || '',
          time: review.publishTime || ''
        })) || [],
        businessStatus: data.businessStatus,
        userRatingsTotal: data.userRatingCount
      }
    } catch (error) {
      console.error('Places details error:', error)
      throw error
    }
  }

  /**
   * 주변 장소 검색
   * https://developers.google.com/maps/documentation/places/web-service/nearby-search
   */
  async nearbySearch(
    location: { lat: number; lng: number },
    radius: number = 1000,
    types?: string[],
    keyword?: string
  ): Promise<PlaceSearchResult[]> {
    const url = `${this.baseUrl}/places:searchNearby`
    
    const requestBody = {
      locationRestriction: {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng
          },
          radius: radius
        }
      },
      includedTypes: types,
      maxResultCount: 20,
      languageCode: 'ko',
      ...(keyword && { textQuery: keyword })
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.priceLevel'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Places API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return data.places?.map((place: any) => ({
        placeId: place.id,
        name: place.displayName?.text || '',
        address: place.formattedAddress || '',
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0
        },
        types: place.types || [],
        rating: place.rating,
        priceLevel: place.priceLevel
      })) || []
    } catch (error) {
      console.error('Places nearby search error:', error)
      throw error
    }
  }

  /**
   * 텍스트 검색
   * https://developers.google.com/maps/documentation/places/web-service/text-search
   */
  async textSearch(
    query: string,
    location?: { lat: number; lng: number },
    radius?: number
  ): Promise<PlaceSearchResult[]> {
    const url = `${this.baseUrl}/places:searchText`
    
    const requestBody = {
      textQuery: query,
      maxResultCount: 20,
      languageCode: 'ko',
      ...(location && radius && {
        locationBias: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng
            },
            radius: radius
          }
        }
      })
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.priceLevel'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Places API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      return data.places?.map((place: any) => ({
        placeId: place.id,
        name: place.displayName?.text || '',
        address: place.formattedAddress || '',
        location: {
          lat: place.location?.latitude || 0,
          lng: place.location?.longitude || 0
        },
        types: place.types || [],
        rating: place.rating,
        priceLevel: place.priceLevel
      })) || []
    } catch (error) {
      console.error('Places text search error:', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 생성
let placesServiceInstance: PlacesService | null = null

export const getPlacesService = (): PlacesService => {
  if (!placesServiceInstance) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_KEY || ''
    if (!apiKey) {
      throw new Error('Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAP_KEY environment variable.')
    }
    placesServiceInstance = new PlacesService(apiKey)
  }
  return placesServiceInstance
}

export default PlacesService