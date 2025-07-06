/**
 * 장르별 애니메이션 설정
 * FSD: shared/lib/story
 */

import { GenreAnimationConfig, StoryGenre } from './types'

export const GENRE_ANIMATIONS: Record<StoryGenre, GenreAnimationConfig> = {
  SF: {
    genre: 'SF',
    primaryColor: '#00ffff',
    secondaryColor: '#0066ff',
    backgroundPattern: 'geometric',
    transitionType: 'slide',
    duration: 0.8
  },
  romance: {
    genre: 'romance',
    primaryColor: '#ff69b4',
    secondaryColor: '#ff1493',
    backgroundPattern: 'organic',
    transitionType: 'fade',
    duration: 1.2
  },
  comedy: {
    genre: 'comedy',
    primaryColor: '#ffd700',
    secondaryColor: '#ff8c00',
    backgroundPattern: 'particles',
    transitionType: 'bounce',
    duration: 0.6
  },
  mystery: {
    genre: 'mystery',
    primaryColor: '#8a2be2',
    secondaryColor: '#4b0082',
    backgroundPattern: 'waves',
    transitionType: 'scale',
    duration: 1.0
  },
  drama: {
    genre: 'drama',
    primaryColor: '#696969',
    secondaryColor: '#2f4f4f',
    backgroundPattern: 'minimal',
    transitionType: 'fade',
    duration: 1.5
  },
  adventure: {
    genre: 'adventure',
    primaryColor: '#228b22',
    secondaryColor: '#006400',
    backgroundPattern: 'organic',
    transitionType: 'rotate',
    duration: 0.9
  }
}

export const getGenreAnimation = (genre: StoryGenre): GenreAnimationConfig => {
  return GENRE_ANIMATIONS[genre]
}