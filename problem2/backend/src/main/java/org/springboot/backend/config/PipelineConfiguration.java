package org.springboot.backend.config;

import tools.jackson.databind.ObjectMapper;
import org.springboot.backend.ai.*;
import org.springframework.context.annotation.*;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import java.net.http.HttpClient;
import java.time.*;
import org.springframework.boot.servlet.MultipartConfigFactory;
import jakarta.servlet.MultipartConfigElement;
import org.springframework.util.unit.DataSize;

@Configuration
@EnableAsync
public class PipelineConfiguration {
    @Bean Clock clock(){ return Clock.systemUTC(); }
    @Bean HttpClient httpClient(){ return HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NEVER).build(); }
    @Bean MultipartConfigElement multipartConfig(){var factory=new MultipartConfigFactory();factory.setMaxFileSize(DataSize.ofMegabytes(20));factory.setMaxRequestSize(DataSize.ofMegabytes(21));return factory.createMultipartConfig();}
    @Bean("pipelineExecutor") TaskExecutor pipelineExecutor(){var executor=new ThreadPoolTaskExecutor();executor.setCorePoolSize(2);executor.setMaxPoolSize(4);executor.setQueueCapacity(50);executor.setThreadNamePrefix("content-pipeline-");executor.initialize();return executor;}
    @Bean AiGateway aiGateway(Environment env, ObjectMapper mapper, HttpClient http) {
        String key=env.getProperty("AI_API_KEY", "").trim();
        if(key.isEmpty()) return new ExtractiveAiGateway(mapper);
        return new CompatibleAiGateway(http, mapper,
                env.getProperty("AI_BASE_URL", "https://api.openai.com/v1").replaceAll("/$", ""), key,
                env.getProperty("AI_MODEL", "gpt-4.1-mini"));
    }
}
