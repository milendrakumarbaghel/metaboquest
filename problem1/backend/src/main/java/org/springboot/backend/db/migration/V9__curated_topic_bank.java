package org.springboot.backend.db.migration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.zip.CRC32;

/** Source-checked educational content (reviewedBy null); publication is not clinical sign-off. */
@Component
public class V9__curated_topic_bank extends BaseJavaMigration {
    private static final String TOPICS = "'GENERAL','SAFETY','MUSCLE','SIDE_EFFECTS','MAINTENANCE','DIABETES','ELIGIBILITY'";
    private static final String EVENTS = "'GAME_STARTED','QUESTION_ANSWERED','GAME_COMPLETED','RESULT_SHARED','FRIEND_CHALLENGE_CREATED','FRIEND_CHALLENGE_OPENED','CTA_CLICKED','TOPIC_SELECTED'";

    private byte[] content() {
        try (var input = new ClassPathResource("data/glp1-topic-bank-v9.json").getInputStream()) {
            return input.readAllBytes();
        } catch (Exception e) { throw new IllegalStateException("Topic question bank unavailable", e); }
    }

    @Override public Integer getChecksum() {
        var checksum = new CRC32();
        checksum.update(content());
        return (int) checksum.getValue();
    }

    @Override public void migrate(Context context) throws Exception {
        Connection db = context.getConnection();
        replaceCheck(db, "quiz_questions", "learning_topic", "learning_topic IN (" + TOPICS + ")");
        replaceCheck(db, "quiz_sessions", "learning_topic", "learning_topic IN (" + TOPICS + ")");
        replaceCheck(db, "analytics_events", "event_type", "event_type IN (" + EVENTS + ")");

        JsonNode bank = new ObjectMapper().readTree(content());
        for (JsonNode retitle : bank.get("retitle"))
            execute(db, "UPDATE medical_sources SET title=? WHERE source_url=?", retitle.get("title").asText(), retitle.get("url").asText());

        Map<String, UUID> sourceIds = new HashMap<>();
        for (int k = 0; k < bank.get("sources").size(); k++) {
            JsonNode source = bank.get("sources").get(k);
            String url = source.get("url").asText();
            UUID existing = query(db, "SELECT id FROM medical_sources WHERE source_url=?", url);
            if (existing == null) {
                existing = id(2, 100 + k);
                execute(db, "INSERT INTO medical_sources (id,title,organization,source_url,source_type,accessed_at) VALUES (?,?,?,?,?,now())",
                        existing, source.get("title").asText(), source.get("organization").asText(), url, source.get("type").asText());
            }
            sourceIds.put(source.get("key").asText(), existing);
        }

        for (JsonNode q : bank.get("questions")) {
            int n = q.get("number").asInt();
            execute(db, "INSERT INTO quiz_questions (id,question_set_id,question_text,question_type,category,difficulty,explanation,display_order,active,review_status,learning_topic) VALUES (?,?,?,?,?,'EASY',?,?,TRUE,'APPROVED',?)",
                    id(3, n), id(1, 1), q.get("text").asText(), q.get("type").asText(), q.get("category").asText(), q.get("explanation").asText(), n, q.get("topic").asText());
            for (int i = 0; i < q.get("options").size(); i++) execute(db,
                    "INSERT INTO question_options (id,question_id,option_text,is_correct,display_order) VALUES (?,?,?,?,?)",
                    id(4, n * 10 + i + 1), id(3, n), q.get("options").get(i).asText(), i == q.get("correct").asInt(), i + 1);
            for (JsonNode key : q.get("sourceKeys")) execute(db, "INSERT INTO question_medical_sources (question_id,source_id) VALUES (?,?)",
                    id(3, n), sourceIds.get(key.asText()));
        }

        for (JsonNode change : bank.get("reassign"))
            execute(db, "UPDATE quiz_questions SET learning_topic=?, updated_at=now() WHERE id=?", change.get("topic").asText(), id(3, change.get("number").asInt()));
        for (JsonNode number : bank.get("retire"))
            execute(db, "UPDATE quiz_questions SET active=FALSE, updated_at=now() WHERE id=?", id(3, number.asInt()));
        execute(db, "UPDATE question_sets SET version=4,updated_at=now() WHERE id=?", id(1, 1));
    }

    /** Drops every CHECK that mentions the column (names differ by migration) and adds one named replacement. */
    private static void replaceCheck(Connection db, String table, String column, String condition) throws Exception {
        List<String> names = new ArrayList<>();
        try (var statement = db.prepareStatement("SELECT conname FROM pg_constraint WHERE conrelid=?::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE ?")) {
            statement.setString(1, table);
            statement.setString(2, "%" + column + "%");
            try (var rows = statement.executeQuery()) { while (rows.next()) names.add(rows.getString(1)); }
        }
        for (String name : names) execute(db, "ALTER TABLE " + table + " DROP CONSTRAINT \"" + name.replace("\"", "\"\"") + "\"");
        execute(db, "ALTER TABLE " + table + " ADD CONSTRAINT ck_" + table + "_" + column + " CHECK (" + condition + ")");
    }

    private static UUID id(int prefix, int number) {
        return UUID.fromString(prefix + "0000000-0000-0000-0000-" + String.format("%012d", number));
    }
    private static UUID query(Connection db, String sql, String arg) throws Exception {
        try (var statement = db.prepareStatement(sql)) {
            statement.setString(1, arg);
            try (var rows = statement.executeQuery()) { return rows.next() ? (UUID) rows.getObject(1) : null; }
        }
    }
    private static void execute(Connection db, String sql, Object... args) throws Exception {
        try (var statement = db.prepareStatement(sql)) {
            for (int i = 0; i < args.length; i++) statement.setObject(i + 1, args[i]);
            statement.executeUpdate();
        }
    }
}
