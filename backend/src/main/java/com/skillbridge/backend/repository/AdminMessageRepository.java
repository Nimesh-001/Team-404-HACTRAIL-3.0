package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.AdminMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AdminMessageRepository extends JpaRepository<AdminMessage, Long> {
    List<AdminMessage> findByRecipientIdOrderBySentAtDesc(Long recipientId);
}
