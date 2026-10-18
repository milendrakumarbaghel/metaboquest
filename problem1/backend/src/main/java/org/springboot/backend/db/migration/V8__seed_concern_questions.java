package org.springboot.backend.db.migration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.util.UUID;
import java.util.zip.CRC32;

/** Immutable, source-checked educational content; publication is not clinical sign-off. */
@Component
public class V8__seed_concern_questions extends BaseJavaMigration {
    private byte[] content() {
        try (var input = new ClassPathResource("data/glp1-question-bank.json").getInputStream()) {
            return input.readAllBytes();
        } catch (Exception e) { throw new IllegalStateException("Question bank unavailable", e); }
    }

    @Override public Integer getChecksum() {
        var checksum = new CRC32();
        checksum.update(content());
        return (int) checksum.getValue();
    }

    @Override public void migrate(Context context) throws Exception {
        Connection db = context.getConnection();
        for (String table : new String[]{"quiz_questions", "quiz_sessions"}) {
            execute(db, "ALTER TABLE " + table + " ADD COLUMN learning_topic VARCHAR(24) NOT NULL DEFAULT 'GENERAL' CHECK (learning_topic IN ('GENERAL','SAFETY','MUSCLE','SIDE_EFFECTS','MAINTENANCE','ELIGIBILITY'))");
        }
        String[] topics = {"SAFETY", "MUSCLE", "MAINTENANCE", "SAFETY", "SAFETY", "MUSCLE", "MUSCLE", "MAINTENANCE", "MAINTENANCE"};
        for (int i = 0; i < topics.length; i++) execute(db, "UPDATE quiz_questions SET learning_topic=? WHERE id=?", topics[i], id(3, i + 1));
        JsonNode bank = new ObjectMapper().readTree(content());
        for (int i = 0; i < bank.get("sources").size(); i++) {
            JsonNode source = bank.get("sources").get(i);
            // Existing NIDDK source is reused, avoiding duplicate URL constraints.
            if (i == 0) continue;
            execute(db, "INSERT INTO medical_sources (id,title,organization,source_url,source_type,accessed_at) VALUES (?,?,?,?,'CLINICAL_GUIDANCE',now())",
                    id(2, i + 3), source.get("title").asText(), source.get("organization").asText(), source.get("url").asText());
        }
        for (JsonNode q : bank.get("questions")) {
            int n = q.get("number").asInt();
            execute(db, "INSERT INTO quiz_questions (id,question_set_id,question_text,question_type,category,difficulty,explanation,display_order,active,review_status,learning_topic) VALUES (?,?,?,?,?,'EASY',?,?,TRUE,'APPROVED',?)",
                    id(3,n), id(1,1), q.get("text").asText(), q.get("type").asText(), q.get("category").asText(), q.get("explanation").asText(), n, q.get("topic").asText());
            for (int i = 0; i < q.get("options").size(); i++) execute(db,
                    "INSERT INTO question_options (id,question_id,option_text,is_correct,display_order) VALUES (?,?,?,?,?)",
                    id(4,n * 2 - 1 + i), id(3,n), q.get("options").get(i).asText(), i == q.get("correct").asInt(), i + 1);
            int source = q.get("source").asInt();
            execute(db, "INSERT INTO question_medical_sources (question_id,source_id) VALUES (?,?)", id(3,n), id(2,source == 0 ? 1 : source + 3));
        }
        execute(db, "UPDATE question_sets SET version=3,updated_at=now() WHERE id=?", id(1,1));
    }

    private static UUID id(int prefix, int number) {
        return UUID.fromString(prefix + "0000000-0000-0000-0000-" + String.format("%012d", number));
    }
    private static void execute(Connection db, String sql, Object... args) throws Exception {
        try (var statement = db.prepareStatement(sql)) {
            for (int i = 0; i < args.length; i++) statement.setObject(i + 1, args[i]);
            statement.executeUpdate();
        }
    }
}
