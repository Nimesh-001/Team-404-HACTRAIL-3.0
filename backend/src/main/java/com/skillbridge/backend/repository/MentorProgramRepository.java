package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.MentorProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MentorProgramRepository extends JpaRepository<MentorProgram, Long> {
    List<MentorProgram> findAllByOrderByCreatedAtDesc();
}
