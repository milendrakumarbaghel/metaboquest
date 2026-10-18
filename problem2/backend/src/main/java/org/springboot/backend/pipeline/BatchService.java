package org.springboot.backend.pipeline;

import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import org.springboot.backend.domain.BatchRun;
import org.springboot.backend.repository.BatchRunRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.core.task.TaskExecutor;
import org.springframework.beans.factory.annotation.Qualifier;
import java.time.*;
import java.util.*;

@Service
public class BatchService {
    private final BatchRunRepository batches;private final PipelineService pipeline;private final ObjectMapper mapper;private final Clock clock;private final TaskExecutor executor;
    public BatchService(BatchRunRepository batches,PipelineService pipeline,ObjectMapper mapper,Clock clock,@Qualifier("pipelineExecutor") TaskExecutor executor){this.batches=batches;this.pipeline=pipeline;this.mapper=mapper;this.clock=clock;this.executor=executor;}
    public BatchRun start(List<UUID> paperIds,String language,String audience){
        BatchRun batch=batches.save(new BatchRun(UUID.randomUUID(),paperIds.size(),mapper.createArrayNode(),mapper.createArrayNode(),clock.instant()));
        executor.execute(()->process(batch.getId(),paperIds,language,audience));return batch;
    }
    void process(UUID batchId,List<UUID> paperIds,String language,String audience){
        ArrayNode ids=mapper.createArrayNode(),errors=mapper.createArrayNode();int completed=0,failed=0;
        for(UUID paperId:paperIds)try{ids.add(pipeline.generate(paperId,language,audience).getId().toString());completed++;}catch(RuntimeException e){errors.addObject().put("paperId",paperId.toString()).put("message",e.getMessage());failed++;}
        BatchRun batch=batches.findById(batchId).orElseThrow();
        batch.finish(completed,failed,ids,errors,clock.instant());batches.save(batch);
    }
    @Transactional(readOnly=true) public BatchRun get(UUID id){return batches.findById(id).orElseThrow(()->org.springboot.backend.common.ApiException.notFound("Batch not found"));}
}
