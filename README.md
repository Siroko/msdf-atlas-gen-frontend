# MSDF Artery Font Generator

A web tool for converting TTF/OTF fonts into MSDF (Multi-channel Signed Distance Field) atlas fonts in the Artery format (.arfont) for GPU-based text rendering.

## About

This tool is specifically designed to generate optimized font assets for the [Kansei WebGPU engine](https://github.com/Siroko/kansei). It converts standard font files into distance field based fonts that can be efficiently rendered on the GPU using WebGPU/WebGL.

## Usage

1. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser
3. Upload a TTF or OTF font file
4. Configure the MSDF generation parameters
5. Generate and download your .arfont file

## Features

- TTF/OTF to MSDF conversion
- Customizable glyph selection
- Configurable MSDF generation parameters
- Automatic .arfont file generation
- Optimized for Kansei WebGPU engine

## Technology

Built with Next.js and integrates with the msdf-atlas-gen tool for font processing.

## Learn More

- [Kansei Documentation](https://github.com/Siroko/kansei)
- [Next.js Documentation](https://nextjs.org/docs)
