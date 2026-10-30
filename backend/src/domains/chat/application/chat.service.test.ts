import assert from "node:assert/strict";
import test from "node:test";
import { openChatDatabase } from "../../../platform/database/chatDatabase.js";
import { setSkillRepository } from "../../skills/http/skill.controller.js";
import { SkillRepository } from "../../skills/repositories/skillRepository.js";
import { resolveChatSkillsContext } from "./chat.service.js";

test("chat prompt only loads skills from a conversation owned by the requesting user", async () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  setSkillRepository(repo);

  try {
    const privateSkill = await repo.create({
      id: "private-conversation-skill",
      name: "Victim private skill",
      description: "Confidential skill metadata",
      scope: "user",
      ownerId: "user-victim",
      storagePath: "",
    });
    await repo.setConversationSkills("victim-conversation", [privateSkill.id], "user-victim");

    const payload = {
      model: "gemini-3.8-flash",
      messages: [{ role: "user" as const, content: "Hello" }],
      conversationId: "victim-conversation",
    };

    const attackerContext = await resolveChatSkillsContext(payload, { userId: "user-attacker" });
    assert.deepEqual(attackerContext.conversationSkills, []);
    assert.equal(attackerContext.progressiveSkillsPrompt, "");

    const ownerContext = await resolveChatSkillsContext(payload, { userId: "user-victim" });
    assert.equal(ownerContext.conversationSkills[0]?.id, privateSkill.id);
    assert.match(ownerContext.progressiveSkillsPrompt, /Victim private skill/);
  } finally {
    setSkillRepository(null);
    db.close();
  }
});

test("chat prompt stops using an organization skill after the user loses organization access", async () => {
  const db = openChatDatabase(":memory:");
  const repo = new SkillRepository(db);
  setSkillRepository(repo);

  try {
    const organizationSkill = await repo.create({
      id: "revoked-organization-skill",
      name: "Former organization skill",
      description: "Private organization instructions",
      scope: "org",
      ownerId: "organization-admin",
      orgId: "old-organization",
      storagePath: "",
    });
    await repo.setConversationSkills(
      "organization-conversation",
      [organizationSkill.id],
      "former-member"
    );

    const payload = {
      model: "gemini-3.8-flash",
      messages: [{ role: "user" as const, content: "Use my saved settings." }],
      conversationId: "organization-conversation",
    };

    const activeMemberContext = await resolveChatSkillsContext(payload, {
      userId: "former-member",
      orgId: "old-organization",
    });
    assert.equal(activeMemberContext.conversationSkills[0]?.id, organizationSkill.id);

    const revokedMemberContext = await resolveChatSkillsContext(payload, {
      userId: "former-member",
      orgId: null,
    });
    assert.deepEqual(revokedMemberContext.conversationSkills, []);
    assert.equal(revokedMemberContext.progressiveSkillsPrompt, "");
  } finally {
    setSkillRepository(null);
    db.close();
  }
});
