# Use Ubuntu 24.04 as base for newer libstdc++6
FROM ubuntu:24.04

# Install Node.js 18, npm, and dependencies for TexturePacker
RUN apt-get update && \
    apt-get install -y curl wget libqt5core5a libqt5gui5 libqt5widgets5 && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Download and install TexturePacker 7.7.0
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

# Debug: Show where TexturePacker is installed
RUN ls -l /usr/bin/ | grep -i texturepacker || true
RUN ls -l /usr/local/bin/ | grep -i texturepacker || true
RUN find / -type f -iname '*texturepacker*' || true

# Start the app
CMD ["npm", "start"]