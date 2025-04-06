import React from 'react';
import { useParams } from 'react-router-dom';

function TestLearningPage() {
  const { courseId } = useParams();
  
  return (
    <div style={{ 
      padding: '50px',
      textAlign: 'center',
      backgroundColor: '#f0f9ff',
      minHeight: '100vh'
    }}>
      <h1 style={{ 
        color: '#0066cc', 
        fontSize: '2rem',
        marginBottom: '20px'
      }}>
        Test Learning Page
      </h1>
      
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <h2 style={{ color: '#333', marginBottom: '10px' }}>
          Course ID: {courseId}
        </h2>
        <p style={{ color: '#666' }}>
          This is a test page to verify that navigation works correctly.
          If you can see this page, the routing to the learning page is working!
        </p>
      </div>
    </div>
  );
}

export default TestLearningPage; 