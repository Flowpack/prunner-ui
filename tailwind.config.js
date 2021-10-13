module.exports = {
  mode: "jit",
  purge: ["./public/**/*.html", "./src/**/*.{js,jsx,ts,tsx,vue}"],
  theme: {
    fontFamily: {
      'sans': '"Noto Sans", sans-serif',
      'mono': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',

    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: {
        DEFAULT: '#ffffff',
      },
      black: {
        DEFAULT: '#000000',
      },
      blue: {
        DEFAULT: '#00b5ff',
      },
      green: {
        DEFAULT: '#00a338',
      },
      gray: {
        800: '#141414',
        700: '#222222',
        600: '#323232',
        500: '#3f3f3f',
        DEFAULT: '#999999',
        400: '#c4c4c4',
      },
      orange: {
        DEFAULT: '#ff8700',
      },
      red: {
        DEFAULT: '#ff460d',
      }
    },
    fill: theme => ({
      'white': theme('colors.white'),
      'gray-400': theme('colors.gray.400'),
      'gray-500': theme('colors.gray.500'),
      'gray-800': theme('colors.gray.800'),
      'green': theme('colors.green'),
      'orange': theme('colors.orange'),
      'red': theme('colors.red'),
    }),
    stroke: theme => ({
      'white': theme('colors.white'),
      'gray-400': theme('colors.gray.400'),
      'gray-800': theme('colors.gray.800'),
    }),
    boxShadow: {
      'inner-glow': 'inset 0 2px 16px 0 rgba(255, 255, 255, 0.4)',
      'glow': '0 0 2px 2px rgba(255, 255, 255, 0.8)',
    }
  }
};
