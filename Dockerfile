# Use official Node.js image
FROM node:18

# Install dependencies for TexturePacker
RUN apt-get update && apt-get install -y wget

# Download and install TexturePacker CLI (edit version if needed)
RUN wget https://www.codeandweb.com/download/texturepacker/7.0.4/TexturePacker-7.0.4-amd64.deb && \
    dpkg -i TexturePacker-7.0.4-amd64.deb || apt-get -f install -y && \
    rm TexturePacker-7.0.4-amd64.deb

# Set working directory
WORKDIR /opt/render/project/src

# Copy all files
COPY . .

# Install Node.js dependencies
RUN npm install

# Expose the port (Render sets $PORT automatically)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]