import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Checkbox,
  IconButton,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  PlayArrow as PlayArrowIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  Quiz as QuizIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../services/api';

const CourseContent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  
  useEffect(() => {
    fetchCourseContent();
  }, [courseId]);
  
  const fetchCourseContent = async () => {
    try {
      setLoading(true);
      const data = await courseAPI.getCourseContent(courseId);
      setCourseData(data);
      setError(null);
      
      // Auto-expand first incomplete module
      const firstIncompleteModule = data.modules.find(m => m.progress < 100);
      if (firstIncompleteModule) {
        setExpandedModule(firstIncompleteModule.id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLessonComplete = async (lessonId) => {
    try {
      await courseAPI.completeLesson(lessonId);
      await fetchCourseContent(); // Refresh content to update progress
    } catch (err) {
      setError(err.message);
    }
  };
  
  const getLessonIcon = (contentType) => {
    switch (contentType) {
      case 'video':
        return <PlayArrowIcon />;
      case 'text':
        return <DescriptionIcon />;
      case 'assignment':
        return <AssignmentIcon />;
      case 'quiz':
        return <QuizIcon />;
      default:
        return <DescriptionIcon />;
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }
  
  if (!courseData) {
    return null;
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          {courseData.title}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={courseData.progress}
          sx={{ height: 10, borderRadius: 5 }}
        />
        <Typography variant="body2" color="text.secondary" align="right" mt={1}>
          {Math.round(courseData.progress)}% Complete
        </Typography>
      </Box>
      
      {courseData.modules.map((module) => (
        <Accordion
          key={module.id}
          expanded={expandedModule === module.id}
          onChange={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Typography sx={{ flexGrow: 1 }}>{module.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                {Math.round(module.progress)}%
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {module.sections.map((section) => (
              <Accordion
                key={section.id}
                expanded={expandedSection === section.id}
                onChange={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography variant="body1">{section.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto', mr: 2 }}>
                      {Math.round(section.progress)}%
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {section.lessons.map((lesson) => (
                    <Box
                      key={lesson.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        p: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:last-child': { borderBottom: 'none' },
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => navigate(`/courses/${courseId}/lessons/${lesson.id}`)}
                    >
                      <IconButton size="small" sx={{ mr: 1 }}>
                        {getLessonIcon(lesson.content_type)}
                      </IconButton>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {lesson.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
                        {lesson.duration} min
                      </Typography>
                      <Checkbox
                        checked={lesson.is_completed}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleLessonComplete(lesson.id);
                        }}
                        icon={<RadioButtonUncheckedIcon />}
                        checkedIcon={<CheckCircleIcon />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Container>
  );
};

export default CourseContent; 