module.exports = {
  mode: "jit",
  purge: ["./public/**/*.html", "./src/**/*.{js,jsx,ts,tsx,vue}"],
  theme: {
    fontFamily: {
      'sans': '"Noto Sans", sans-serif',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: {
        DEFAULT: '#fff',
      },
      black: {
        DEFAULT: '#000',
      },
      blue: {
        light: '#00b5ff',
        DEFAULT: '#00b5ff',
        dark: '#00b5ff',
      },
      green: {
        light: '#00a338',
        DEFAULT: '#00a338',
        dark: '#00a338',
      },
      gray: {
        700: '#323232',
        600: '#3f3f3f',
        DEFAULT: '#999',
        400: '#c4c4c4',
      },
      orange: {
        DEFAULT: '#ff8700',
      }
    }
  }
};
