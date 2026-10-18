# Multi-stage build with Eclipse Temurin Java 21
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy source code and package application
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime image
FROM eclipse-temurin:21-jre
WORKDIR /app

# Install fontconfig and fonts for Java AWT / PDFBox / Graphics2D rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    fontconfig \
    libfreetype6 \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/*.jar app.jar

# Render default port is 10000, fallback to 8080
ENV PORT=10000
EXPOSE 10000 8080

ENTRYPOINT ["java", "-Djava.awt.headless=true", "-Djava.security.egd=file:/dev/./urandom", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]

