package com.skillbridge.backend.repository;

import com.skillbridge.backend.entity.MentorApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MentorApplicationRepository extends JpaRepository<MentorApplication, Long> {
    List<MentorApplication> findAllByOrderByAppliedAtDesc();
    List<MentorApplication> findByStudentIdOrderByAppliedAtDesc(Long studentId);
    boolean existsByStudentIdAndMentorProgramId(Long studentId, Long mentorProgramId);
}
