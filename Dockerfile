# Use official Node.js image
FROM node:18

# Install dependencies for TexturePacker
RUN apt-get update && \
    apt-get install -y wget libqt5core5a libqt5gui5 libqt5widgets5

# Download and install TexturePacker CLI (edit version if needed)
RUN wget https://www.codeandweb.com/download/texturepacker/7.7.0/TexturePacker-7.7.0.deb && \
    apt-get install -y ./TexturePacker-7.7.0.deb && \
    rm TexturePacker-7.7.0.deb

# Set working directory
WORKDIR /opt/render/project/src

# Copy all files
COPY . .

# Install Node.js dependencies
RUN npm install

# Expose the port (Render sets $PORT automatically)
EXPOSE 3000

RUN ls -l /usr/bin/ | grep -i texturepacker || true
RUN ls -l /usr/local/bin/ | grep -i texturepacker || true
RUN find / -type f -iname '*texturepacker*' || true

# Start the app
CMD ["npm", "start"]