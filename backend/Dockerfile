# =========================================================================
# CoreHub Spring Boot Backend - Production Multi-Stage Dockerfile
# Compatible with OpenJDK 26 and Spring Boot 4.x
# =========================================================================

# -------------------------------------------------------------------------
# Stage 1: Build & Package Artifact
# -------------------------------------------------------------------------
FROM eclipse-temurin:26-jdk AS builder
WORKDIR /app

# Install Maven for containerized build
RUN apt-get update && \
    apt-get install -y --no-install-recommends maven && \
    rm -rf /var/lib/apt/lists/*

# Copy Maven descriptor
COPY pom.xml .

# Pre-fetch dependencies for efficient Docker layer caching
RUN mvn dependency:go-offline -B || true

# Copy source tree
COPY src ./src

# Build production executable JAR (tests run in CI pipeline)
RUN mvn clean package -DskipTests -B

# -------------------------------------------------------------------------
# Stage 2: Minimal Production Runtime
# -------------------------------------------------------------------------
FROM eclipse-temurin:26-jre
WORKDIR /app

# Security best practice: Create a dedicated non-root service account
RUN groupadd -r corehub && useradd -r -g corehub -s /bin/false corehub

# Copy only the final executable JAR from the builder stage
COPY --from=builder --chown=corehub:corehub /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

USER corehub:corehub

# Railway injects $PORT dynamically at container startup; fallback to 8080
ENV PORT=8080
EXPOSE ${PORT}

# Production JVM flags for container environments and fast random generation
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
