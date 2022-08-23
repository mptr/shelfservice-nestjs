import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from 'src/config/config.module';
import { WorkflowLoggingModule } from 'src/workflow-logging/workflow-logging.module';
import { K8sJobService } from './k8s-job.service';

@Module({
	imports: [ConfigModule, forwardRef(() => WorkflowLoggingModule)],
	providers: [K8sJobService],
	exports: [K8sJobService],
})
export class KubernetesModule {}
